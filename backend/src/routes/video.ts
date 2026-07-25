import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { chatWithAI } from '../services/ai'

const router = Router()

// Analyze video
router.post('/analyze', optionalAuth, async (req: Request, res: Response) => {
  try {
    const response = await chatWithAI([
      { role: 'system', content: `You are a video editing expert. Help users analyze and improve their video content with actionable feedback on quality, audio, pacing, transitions, and content structure.` },
      { role: 'user', content: `Provide a comprehensive video improvement plan covering:\n1. Overall quality assessment\n2. Pacing, audio, and visual improvements\n3. Transitions and effects suggestions\n4. Color grading recommendations\n5. Caption and subtitle suggestions\n6. Title and description optimization\n7. Platform-specific recommendations` },
    ])

    res.json({ content: response, message: 'Video analysis complete.' })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Video analysis failed' })
  }
})

// Generate video script
router.post('/script', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { topic, platform } = req.body
    if (!topic) return res.status(400).json({ message: 'Topic is required' })

    const platformContext = platform ? ` for ${platform}` : ''
    const response = await chatWithAI([
      { role: 'system', content: `You are a video content strategist. Create engaging scripts with hooks, structure, timestamps, B-roll suggestions, and CTAs.` },
      { role: 'user', content: `Create a video script about "${topic}"${platformContext}.\n\nInclude:\n1. Engaging hook (first 5 seconds)\n2. Full script with timestamps\n3. B-roll and visual suggestions\n4. On-screen text overlays\n5. Music mood suggestions\n6. Call to action\n7. Title, description, and hashtags` },
    ])

    res.json({ content: response, topic, platform })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Script generation failed' })
  }
})

export default router
