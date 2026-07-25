import { FiCode, FiImage, FiSearch, FiMessageSquare, FiZap, FiGlobe, FiDatabase, FiLock } from 'react-icons/fi'
import { useSettingsStore } from '@/store/settingsStore'
import type { AIMode } from '@/types'

interface WelcomeScreenProps {
  onSend: (content: string) => void
}

const suggestions: Record<AIMode, { icon: any; title: string; prompt: string }[]> = {
  code: [
    { icon: FiCode, title: 'Build a React component', prompt: 'Create a responsive navigation bar component in React with Tailwind CSS that includes a mobile hamburger menu' },
    { icon: FiZap, title: 'Debug my code', prompt: 'I have a bug in my JavaScript code. Can you help me find and fix it?' },
    { icon: FiDatabase, title: 'Design a database', prompt: 'Design a PostgreSQL database schema for an e-commerce platform with users, products, orders, and reviews' },
    { icon: FiGlobe, title: 'Build a full-stack app', prompt: 'Help me build a full-stack todo application with React, Node.js, and MongoDB' },
  ],
  creative: [
    { icon: FiImage, title: 'Edit an image', prompt: 'I want to edit an image - help me remove the background and make it look professional' },
    { icon: FiCode, title: 'Plan a video', prompt: 'Create a YouTube video script and storyboard about web development tips for beginners' },
    { icon: FiZap, title: 'Design a logo', prompt: 'Help me design a modern, minimalistic logo for a tech startup called "InnovateTech"' },
    { icon: FiGlobe, title: 'Content ideas', prompt: 'Generate 10 content ideas for a tech YouTube channel focused on programming tutorials' },
  ],
  search: [
    { icon: FiSearch, title: 'Find documentation', prompt: 'Find the latest React 19 documentation and explain the new features' },
    { icon: FiGlobe, title: 'Research a topic', prompt: 'Research and compare the best databases for a social media application in 2024' },
    { icon: FiZap, title: 'Find solutions', prompt: 'Find solutions for implementing real-time chat in a web application' },
    { icon: FiDatabase, title: 'Tech comparison', prompt: 'Compare Next.js vs Remix for building modern web applications' },
  ],
  general: [
    { icon: FiMessageSquare, title: 'Learn something new', prompt: 'Explain how machine learning works in simple terms that anyone can understand' },
    { icon: FiCode, title: 'Write an essay', prompt: 'Help me write a well-structured essay about the impact of AI on modern education' },
    { icon: FiZap, title: 'Solve a problem', prompt: 'I need help planning a project timeline for launching a new website in 2 months' },
    { icon: FiLock, title: 'Security review', prompt: 'Review these security best practices for web applications and explain the most important ones' },
  ],
}

const modeInfo: Record<AIMode, { title: string; description: string; gradient: string }> = {
  code: {
    title: 'Avery Code',
    description: 'Your intelligent coding assistant. Ask anything about programming, debugging, or building applications.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  creative: {
    title: 'Avery Creative',
    description: 'Your creative partner for image editing, video production, content creation, and design.',
    gradient: 'from-pink-500 to-rose-500',
  },
  search: {
    title: 'Avery Search',
    description: 'Intelligent search across the web. Find documentation, tutorials, and current information.',
    gradient: 'from-green-500 to-emerald-500',
  },
  general: {
    title: 'Avery Chat',
    description: 'Your versatile AI assistant for learning, writing, analysis, and everyday questions.',
    gradient: 'from-primary-500 to-purple-500',
  },
}

export default function WelcomeScreen({ onSend }: WelcomeScreenProps) {
  const aiMode = useSettingsStore((s) => s.aiMode)
  const info = modeInfo[aiMode]
  const items = suggestions[aiMode]

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${info.gradient} flex items-center justify-center mb-6 shadow-lg`}>
        <span className="text-white font-bold text-2xl">DK</span>
      </div>

      <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{info.title}</h2>
      <p className="text-surface-500 dark:text-surface-400 text-center max-w-md mb-8">
        {info.description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSend(item.prompt)}
            className="card hover:bg-surface-50 dark:hover:bg-surface-700/50 text-left transition-all duration-200 hover:shadow-md group"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${info.gradient} bg-opacity-10 text-primary-500 group-hover:scale-110 transition-transform`}>
                <item.icon size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-surface-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">{item.prompt}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
