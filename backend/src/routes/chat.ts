import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { validate, chatMessageSchema } from '../middleware/validation'
import { chatWithAI } from '../services/ai'

const router = Router()

// Send message (non-streaming)
router.post('/send', optionalAuth, validate(chatMessageSchema), async (req: any, res: Response) => {
  try {
    const { content, mode, context } = req.validatedBody
    const systemPrompt = buildSystemPrompt(mode, context)

    const response = await chatWithAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ])

    res.json({ content: response })
  } catch (error: any) {
    console.error('Chat error:', error)
    res.status(500).json({
      message: error.message || 'Failed to process message',
      content: `I encountered an error: ${error.message}. Please check that your AI API key is configured in the backend .env file.`,
    })
  }
})

// Stream message (SSE)
router.post('/stream', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { content, mode, context } = req.body

    if (!content) {
      return res.status(400).json({ message: 'Content is required' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const systemPrompt = buildSystemPrompt(mode, context)

    try {
      const { chatWithAIStream } = await import('../services/ai')
      const stream = await chatWithAIStream([
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ])

      for await (const chunk of stream) {
        if (chunk) {
          res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`)
        }
      }

      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`)
    } catch (streamError: any) {
      const response = await chatWithAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ])
      res.write(`data: ${JSON.stringify({ content: response, done: false })}\n\n`)
      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`)
    }

    res.end()
  } catch (error: any) {
    console.error('Stream error:', error)
    if (!res.headersSent) {
      res.status(500).json({ message: error.message || 'Stream failed' })
    } else {
      res.write(`data: ${JSON.stringify({ content: `Error: ${error.message}`, done: true })}\n\n`)
      res.end()
    }
  }
})

function buildSystemPrompt(mode: string, context?: any): string {
  const base = `You are Avery AI, the intelligent assistant of DKINGs AI platform. Be helpful, accurate, and concise. Format responses with Markdown including code blocks with language labels.`

  const modePrompts: Record<string, string> = {
    code: `${base}\n\nYou are Avery Code - an expert programming assistant. You help with:\n- Writing, reviewing, and debugging code in any language\n- Explaining errors and providing fixes with before/after comparisons\n- Architecture decisions and best practices\n- Full-stack development guidance\n\nWhen fixing code:\n1. Identify the exact error\n2. Explain what caused it in simple terms\n3. Show the corrected code\n4. Highlight changes made\n5. Suggest improvements\n\nAlways provide complete, working code unless asked for an example.`,

    creative: `${base}\n\nYou are Avery Creative - a creative assistant specializing in:\n- Image editing guidance and techniques\n- Video scripting, storyboarding, and production\n- Content creation for social media platforms\n- Design concepts and visual suggestions\n\nProvide actionable, specific creative guidance.`,

    search: `${base}\n\nYou are Avery Search - an intelligent research assistant. You:\n- Provide accurate, up-to-date information\n- Cite sources when possible\n- Summarize complex topics clearly\n- Compare different options and technologies\n\nDistinguish between your own knowledge and information you're uncertain about.`,

    general: `${base}\n\nYou are Avery Chat - a versatile assistant for:\n- General questions and learning\n- Writing and analysis\n- Problem-solving and planning\n- Everyday assistance\n\nBe conversational, helpful, and accurate.`,
  }

  let prompt = modePrompts[mode] || modePrompts.general

  if (context) {
    if (context.projectName) {
      prompt += `\n\nCurrent project: ${context.projectName}`
      if (context.projectDescription) prompt += `\nDescription: ${context.projectDescription}`
      if (context.instructions) prompt += `\nProject instructions: ${context.instructions}`
      if (context.files && context.files.length > 0) {
        prompt += `\n\nProject files (${context.files.length} files):`
        for (const file of context.files.slice(0, 10)) {
          prompt += `\n--- ${file.name} ---\n${file.content.slice(0, 3000)}`
        }
      }
    }
    if (context.code) prompt += `\n\nCode context (${context.language}):\n\`\`\`${context.language}\n${context.code}\n\`\`\``
    if (context.error) prompt += `\n\nError message:\n${context.error}`
  }

  return prompt
}

export default router
