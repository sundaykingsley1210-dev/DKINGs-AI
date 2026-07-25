import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { validate, codeAnalyzeSchema } from '../middleware/validation'
import { chatWithAI } from '../services/ai'

const router = Router()

// Analyze code
router.post('/analyze', optionalAuth, validate(codeAnalyzeSchema), async (req: any, res: Response) => {
  try {
    const { code, language, error } = req.validatedBody
    let prompt = `Analyze the following ${language} code and provide a detailed review.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``

    if (error) {
      prompt += `\n\nError reported:\n${error}\n\nPlease:\n1. Identify the exact error and its cause\n2. Explain what went wrong in simple terms\n3. Show the corrected code\n4. Highlight the specific changes made\n5. Explain how to prevent this error in the future\n6. Suggest code improvements`
    } else {
      prompt += `\n\nPlease provide:\n1. Code review with any bugs or issues found\n2. Performance analysis\n3. Security considerations\n4. Best practices recommendations\n5. Suggested improvements with corrected code\n6. Overall quality rating`
    }

    const response = await chatWithAI([
      { role: 'system', content: `You are an expert code reviewer and debugger. Provide detailed, actionable analysis. Always show code examples with corrections. Format your response with clear sections using Markdown.` },
      { role: 'user', content: prompt },
    ])

    res.json({ content: response, analysis: response })
  } catch (error: any) {
    console.error('Code analysis error:', error)
    res.status(500).json({ message: error.message || 'Analysis failed' })
  }
})

// Debug code
router.post('/debug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { code, language, errorMessage } = req.body
    const prompt = `Debug this ${language} code that produces the following error:\n\nError: ${errorMessage}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nPlease:\n1. Identify the root cause\n2. Explain why it's happening\n3. Provide the corrected code\n4. Show before/after comparison\n5. Suggest how to prevent similar bugs`

    const response = await chatWithAI([
      { role: 'system', content: 'You are an expert debugger. Analyze code errors precisely and provide clear fixes with explanations.' },
      { role: 'user', content: prompt },
    ])

    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Debug failed' })
  }
})

// Explain code
router.post('/explain', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body
    const prompt = `Explain the following ${language} code in detail:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide:\n1. High-level overview\n2. Line-by-line explanation of key parts\n3. How it fits into a larger context\n4. Any potential issues or improvements`

    const response = await chatWithAI([
      { role: 'system', content: 'You are a code educator. Explain code clearly and thoroughly for developers of all levels.' },
      { role: 'user', content: prompt },
    ])

    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Explanation failed' })
  }
})

// Fix code
router.post('/fix', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { code, language, errorMessage } = req.body
    const prompt = `Fix the following ${language} code:\n\nError: ${errorMessage}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide the complete corrected code with explanations of each fix.`

    const response = await chatWithAI([
      { role: 'system', content: 'You are an expert code fixer. Provide complete, working corrected code with clear explanations.' },
      { role: 'user', content: prompt },
    ])

    res.json({ content: response })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Fix failed' })
  }
})

export default router
