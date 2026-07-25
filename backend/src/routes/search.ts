import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { chatWithAI } from '../services/ai'

const router = Router()

// General search
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { query, category } = req.body
    if (!query) return res.status(400).json({ message: 'Query is required' })

    const categoryContext = category && category !== 'all'
      ? ` Focus on ${category === 'code' ? 'programming and development resources' : category === 'docs' ? 'official documentation' : 'general information'}.`
      : ''

    const prompt = `Search and provide comprehensive information about: "${query}"${categoryContext}\n\nPlease:\n1. Provide a direct, accurate answer\n2. Include relevant details and context\n3. Mention reliable sources\n4. Compare options if applicable\n5. Include actionable recommendations`

    const response = await chatWithAI([
      { role: 'system', content: `You are Avery Search, an intelligent search assistant. Provide accurate, well-sourced information. Be honest about uncertainty.` },
      { role: 'user', content: prompt },
    ])

    const results = generateSearchResults(query, category || 'all')
    res.json({ content: response, results, query })
  } catch (error: any) {
    console.error('Search error:', error)
    res.status(500).json({ message: error.message || 'Search failed' })
  }
})

// Code-specific search
router.post('/code', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { query } = req.body
    const prompt = `Find programming solutions for: "${query}"\n\nProvide:\n1. Relevant code examples\n2. Best practices\n3. Common pitfalls\n4. Recommended libraries or frameworks\n5. Links to official documentation`

    const response = await chatWithAI([
      { role: 'system', content: 'You are a programming search assistant. Focus on accurate, up-to-date coding solutions with practical examples.' },
      { role: 'user', content: prompt },
    ])

    res.json({ content: response, query })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Code search failed' })
  }
})

function generateSearchResults(query: string, category: string) {
  const lower = query.toLowerCase()
  const results: { title: string; url: string; snippet: string; source: string }[] = []

  if (lower.includes('react') || lower.includes('javascript') || lower.includes('frontend')) {
    results.push(
      { title: 'React Documentation', url: 'https://react.dev', snippet: 'The library for web and native user interfaces.', source: 'react.dev' },
      { title: 'MDN Web Docs - JavaScript', url: 'https://developer.mozilla.org', snippet: 'Comprehensive JavaScript documentation.', source: 'MDN' },
      { title: 'JavaScript.info', url: 'https://javascript.info', snippet: 'Modern JavaScript tutorial.', source: 'javascript.info' }
    )
  } else if (lower.includes('python') || lower.includes('django')) {
    results.push(
      { title: 'Python Documentation', url: 'https://docs.python.org/3/', snippet: 'Official Python documentation.', source: 'python.org' },
      { title: 'Django Documentation', url: 'https://docs.djangoproject.com/', snippet: 'The web framework for perfectionists.', source: 'djangoproject.com' }
    )
  } else if (lower.includes('node') || lower.includes('express') || lower.includes('api')) {
    results.push(
      { title: 'Node.js Documentation', url: 'https://nodejs.org/docs/', snippet: 'Node.js runtime documentation.', source: 'nodejs.org' },
      { title: 'Express.js Guide', url: 'https://expressjs.com/', snippet: 'Minimalist web framework for Node.js.', source: 'expressjs.com' }
    )
  } else {
    results.push(
      { title: `Results for "${query}"`, url: '#', snippet: `Information about ${query}.`, source: 'Web Search' },
      { title: `Documentation for ${query}`, url: '#', snippet: `Technical docs for ${query}.`, source: 'Documentation' },
      { title: `Tutorials: ${query}`, url: '#', snippet: `Step-by-step guides for ${query}.`, source: 'Tutorials' }
    )
  }

  return results.slice(0, 5)
}

export default router
