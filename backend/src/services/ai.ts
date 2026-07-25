import OpenAI from 'openai'

export type AIMode = 'code' | 'creative' | 'search' | 'general'

let openaiClient: OpenAI | null = null
let useFallback = false

function getClient(): OpenAI | null {
  if (useFallback) return null
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not set. AI features will use fallback responses.')
      useFallback = true
      return null
    }
    openaiClient = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    })
  }
  return openaiClient
}

export async function chatWithAI(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const client = getClient()
  if (!client) {
    return generateFallbackResponse(messages)
  }

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  })

  return response.choices[0]?.message?.content || ''
}

export async function chatWithAIStream(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<AsyncGenerator<string, void, unknown>> {
  const client = getClient()
  if (!client) {
    return fallbackStream(messages)
  }

  const stream = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 4096,
    stream: true,
  })

  return (async function* () {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) yield content
    }
  })()
}

// Convenience wrapper for OpenAI client methods
export function getAIClient() {
  const client = getClient()
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          if (!client) {
            const content = generateFallbackResponse(params.messages || [])
            return { choices: [{ message: { role: 'assistant', content } }] }
          }
          return client.chat.completions.create(params)
        },
      },
    },
  }
}

async function* fallbackStream(
  messages: { role: string; content: string }[]
): AsyncGenerator<string, void, unknown> {
  const content = generateFallbackResponse(messages)
  const words = content.split(' ')
  for (const word of words) {
    yield word + ' '
  }
}

function generateFallbackResponse(messages: { role: string; content: string }[]): string {
  const userMessage = messages[messages.length - 1]?.content || ''
  const systemMessage = messages[0]?.content || ''

  if (systemMessage.includes('code reviewer') || systemMessage.includes('Avery Code') || systemMessage.includes('debug')) {
    return generateCodeFallback(userMessage)
  }
  if (systemMessage.includes('Avery Creative') || systemMessage.includes('image editor') || systemMessage.includes('video')) {
    return generateCreativeFallback(userMessage)
  }
  if (systemMessage.includes('Avery Search') || systemMessage.includes('search assistant')) {
    return generateSearchFallback(userMessage)
  }
  return generateGeneralFallback(userMessage)
}

function generateCodeFallback(code: string): string {
  return `## ⚙️  DKINGs AI - Code Analysis

> **Note:** The AI API is not configured. Set \`OPENAI_API_KEY\` in \`backend/.env\` for full AI analysis.

### Your Code:
\`\`\`
${code.slice(0, 500)}${code.length > 500 ? '\n... (truncated)' : ''}
\`\`\`

### Code Review Checklist:
1. **Syntax**: Verify brackets, semicolons, and syntax correctness
2. **Naming**: Use clear, descriptive variable/function names
3. **Error Handling**: Implement proper try/catch blocks
4. **Performance**: Avoid unnecessary loops and memory leaks
5. **Security**: Check for XSS, injection, and exposed secrets
6. **Best Practices**: Follow language-specific conventions

### Setup Instructions:
1. Get API key from https://platform.openai.com
2. Add to \`backend/.env\`: \`OPENAI_API_KEY=sk-your-key\`
3. Restart the backend server`
}

function generateCreativeFallback(prompt: string): string {
  return `## 🎨 Avery Creative

> **Note:** AI API not configured. Set \`OPENAI_API_KEY\` in \`backend/.env\` for AI-powered creative guidance.

### Your Request:
"${prompt.slice(0, 200)}"

### Editing Tips:
**Images:** Use Photoshop, GIMP, or Canva. Work with high-res originals. Save PNG for graphics, JPG for photos.
**Video:** Use Premiere Pro, DaVinci Resolve, or Final Cut Pro. Cut on action, add captions for accessibility.
**Content:** Hook viewers in 3 seconds. Tailor to each platform. Use relevant hashtags.`
}

function generateSearchFallback(query: string): string {
  return `## 🔍 Avery Search

> **Note:** AI API not configured. Set \`OPENAI_API_KEY\` in \`backend/.env\` for AI-enhanced search.

### Your Query:
"${query.slice(0, 200)}"

### Recommended Resources:
- 📖 [MDN Web Docs](https://developer.mozilla.org) - Web documentation
- 📚 [Stack Overflow](https://stackoverflow.com) - Programming Q&A
- 🐙 [GitHub](https://github.com) - Open source projects
- 🎓 [freeCodeCamp](https://freecodecamp.org) - Learning platform
- 📖 [Dev.to](https://dev.to) - Developer articles`
}

function generateGeneralFallback(prompt: string): string {
  return `## 💬 Avery Chat

> **Note:** AI API not configured. Set \`OPENAI_API_KEY\` in \`backend/.env\` for intelligent responses.

### Your Question:
"${prompt.slice(0, 200)}"

### What I Can Help With (once configured):
- 💻 Coding and debugging
- 🌐 Web development
- 🎨 Creative projects
- 🔍 Research and search
- 📝 Writing and analysis
- 🛠️ Problem-solving

### Setup:
1. Get API key from https://platform.openai.com
2. Add to \`backend/.env\`: \`OPENAI_API_KEY=sk-your-key\`
3. Restart the server`
}
