import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { chatWithAI } from '../services/ai'

const router = Router()

// Solve question from image
router.post('/solve', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { image, mode, prompt } = req.body

    if (!image) {
      return res.status(400).json({ message: 'Image is required' })
    }

    const modeInstructions: Record<string, string> = {
      auto: `Analyze this image and determine what type of question it is (objective/MCQ, theory, or calculation). Then provide the correct answer with a clear explanation.`,
      objective: `This is a multiple-choice/objective question. Read the question and all options from the image. Analyze each option. Select the correct answer. Explain why it is correct and why the other options are incorrect.`,
      theory: `This is a theory/essay question. Understand the question fully. Provide a well-structured, comprehensive answer with clear explanations and relevant examples.`,
      calculation: `This is a calculation/problem-solving question. Identify all given information. State the formula(s) needed. Show the step-by-step calculation. Provide the final answer with correct units.`,
    }

    const systemPrompt = `You are Avery AI Question Solver — an expert tutor that helps students solve academic questions from images.

Your capabilities:
- Read and understand text from images (OCR)
- Identify the subject and question type
- Solve objective (MCQ), theory, and calculation questions
- Provide step-by-step solutions
- Explain answers in simple, clear language

Subjects you support: Mathematics, Physics, Chemistry, Biology, English, Economics, Government, Geography, Computer Science, General Knowledge, and other academic subjects.

Response format:
1. **Extracted Text**: Show the text you read from the image
2. **Subject**: Identify the subject area
3. **Question Type**: objective/theory/calculation
4. **Answer**: Provide the clear, correct answer
5. **Step-by-step Solution**: For calculations, show all steps
6. **Explanation**: Explain why this is the correct answer

For objective questions, clearly state the selected option (e.g., "Answer: B. 4").
For calculation questions, show formulas, substitution, and final answer with units.
For theory questions, provide structured, well-reasoned answers.

Always be accurate, educational, and helpful. Use Markdown formatting.`

    const userMessage = `Mode: ${mode || 'auto'}\n\n${prompt ? `Additional instructions: ${prompt}\n\n` : ''}Please analyze this image and solve the question shown.`

    // Build the message with image for vision-capable models
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ]

    // If image is a base64 data URL, we can try sending it to vision models
    // For fallback, we describe the image and ask AI to help based on any extracted text
    if (image.startsWith('data:image')) {
      // Base64 image - send as vision content if supported
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: userMessage,
          },
          {
            type: 'image_url',
            image_url: {
              url: image,
            },
          },
        ],
      })
    } else {
      messages.push({ role: 'user', content: userMessage })
    }

    let response: string
    try {
      // Try vision API first
      response = await chatWithAI(messages)
    } catch {
      // Fallback to text-only
      messages[1] = { role: 'user', content: userMessage + '\n\n[Image uploaded - please describe what you see if you can analyze images]' }
      response = await chatWithAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ])
    }

    // Extract metadata from response
    const subject = extractSubject(response)
    const questionType = mode === 'auto' ? detectQuestionType(response) : mode

    res.json({
      content: response,
      extractedText: extractTextFromResponse(response),
      subject,
      questionType,
      explanation: response,
    })
  } catch (error: any) {
    console.error('Question solve error:', error)
    res.status(500).json({ message: error.message || 'Failed to solve question' })
  }
})

// Legacy edit endpoint
router.post('/edit', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { image, prompt } = req.body
    if (!image || !prompt) return res.status(400).json({ message: 'Image and prompt are required' })

    const response = await chatWithAI([
      { role: 'system', content: `You are an expert image editor. Help users edit images with clear, actionable instructions.` },
      { role: 'user', content: `User wants to edit an image: "${prompt}"\n\nProvide step-by-step instructions, tools to use, and code for programmatic editing if applicable.` },
    ])

    res.json({ content: response, message: 'Image editing instructions generated.' })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Image editing failed' })
  }
})

// Generate image prompt
router.post('/generate', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' })

    const response = await chatWithAI([
      { role: 'system', content: `You are an image generation prompt optimizer.` },
      { role: 'user', content: `Optimize this prompt: "${prompt}"\n\nProvide optimized prompt, style parameters, and recommended settings.` },
    ])

    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Image generation failed' })
  }
})

function extractSubject(response: string): string {
  const lower = response.toLowerCase()
  const subjects: Record<string, string[]> = {
    'Mathematics': ['math', 'algebra', 'geometry', 'calculus', 'equation', 'theorem', 'trigonometry'],
    'Physics': ['physics', 'velocity', 'acceleration', 'force', 'energy', 'momentum', 'wave'],
    'Chemistry': ['chemistry', 'chemical', 'molecule', 'atom', 'reaction', 'element', 'compound'],
    'Biology': ['biology', 'cell', 'dna', 'organism', 'ecology', 'anatomy', 'genetics'],
    'English': ['grammar', 'essay', 'literature', 'paragraph', 'sentence', 'noun', 'verb'],
    'Economics': ['economics', 'gdp', 'inflation', 'supply', 'demand', 'market', 'fiscal'],
    'Computer Science': ['algorithm', 'programming', 'code', 'software', 'function', 'variable'],
  }

  for (const [subject, keywords] of Object.entries(subjects)) {
    if (keywords.some((kw) => lower.includes(kw))) return subject
  }
  return 'General'
}

function detectQuestionType(response: string): string {
  const lower = response.toLowerCase()
  if (lower.includes('option') || lower.includes('answer:') || /\b[a-d]\.\s/.test(lower)) return 'objective'
  if (lower.includes('formula') || lower.includes('calculate') || lower.includes('step')) return 'calculation'
  return 'theory'
}

function extractTextFromResponse(response: string): string {
  const textMatch = response.match(/(?:extracted text|text from image|question)[:\s]*\n([\s\S]*?)(?:\n(?:subject|answer|solution))/i)
  return textMatch?.[1]?.trim() || 'Text extracted from uploaded image'
}

export default router
