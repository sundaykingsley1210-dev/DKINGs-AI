import { useState, useCallback, useRef } from 'react'
import {
  FiUpload, FiCamera, FiImage, FiCheckCircle, FiHelpCircle,
  FiLoader, FiBookOpen, FiX, FiFileText, FiRefreshCw, FiSend,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import ChatMessage from '@/components/Chat/ChatMessage'

type SolverMode = 'objective' | 'theory' | 'calculation' | 'auto'
type UploadSource = 'file' | 'camera' | 'paste'

interface SolvedQuestion {
  id: string
  imageUrl: string
  extractedText: string
  subject: string
  questionType: string
  answer: string
  explanation: string
  timestamp: string
}

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Economics', 'Government', 'Geography', 'Computer Science',
  'General Knowledge', 'Other',
]

export default function QuestionSolverPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSolving, setIsSolving] = useState(false)
  const [solution, setSolution] = useState<SolvedQuestion | null>(null)
  const [solverMode, setSolverMode] = useState<SolverMode>('auto')
  const [showCamera, setShowCamera] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [history, setHistory] = useState<SolvedQuestion[]>([])
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [followUpMessages, setFollowUpMessages] = useState<any[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
    e.target.value = ''
  }, [])

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImage(ev.target?.result as string)
      setSolution(null)
      setFollowUpMessages([])
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) processFile(file)
        break
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setShowCamera(true)
    } catch (err) {
      toast.error('Camera access denied. Please enable camera permissions.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
          processFile(file)
          stopCamera()
        }
      }, 'image/jpeg', 0.95)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const handleSolve = async () => {
    if (!image) {
      toast.error('Please upload an image first')
      return
    }

    setIsSolving(true)
    setFollowUpMessages([])

    try {
      const response = await fetch('/api/image/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({
          image,
          mode: solverMode,
          prompt: additionalPrompt || undefined,
        }),
      })

      const data = await response.json()

      if (data.content || data.answer) {
        const result: SolvedQuestion = {
          id: Date.now().toString(),
          imageUrl: image,
          extractedText: data.extractedText || 'Text extracted from image',
          subject: data.subject || 'Auto-detected',
          questionType: data.questionType || solverMode,
          answer: data.content || data.answer,
          explanation: data.explanation || '',
          timestamp: new Date().toISOString(),
        }
        setSolution(result)
        setHistory((prev) => [result, ...prev].slice(0, 50))
        toast.success('Question solved!')
      } else {
        toast.error(data.message || 'Could not solve the question')
      }
    } catch (err: any) {
      toast.error('Failed to solve question. Check if the backend is running.')
      setSolution({
        id: Date.now().toString(),
        imageUrl: image,
        extractedText: '',
        subject: 'Unknown',
        questionType: solverMode,
        answer: `Error: ${err.message}\n\nPlease ensure:\n1. The backend server is running\n2. Your AI API key is configured\n3. The image is clear and readable`,
        explanation: '',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsSolving(false)
    }
  }

  const handleFollowUp = async (question: string) => {
    if (!question.trim() || !solution) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    }
    setFollowUpMessages((prev) => [...prev, userMsg])

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({
          content: `Regarding this question I just solved:\n${solution.answer}\n\nMy follow-up: ${question}`,
          mode: 'general',
        }),
      })
      const data = await response.json()
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'I can help with that.',
        timestamp: new Date().toISOString(),
      }
      setFollowUpMessages((prev) => [...prev, assistantMsg])
    } catch {
      toast.error('Failed to get response')
    }
  }

  const clearImage = () => {
    setImage(null)
    setImageFile(null)
    setSolution(null)
    setFollowUpMessages([])
    setAdditionalPrompt('')
  }

  const modeLabels: Record<SolverMode, string> = {
    auto: 'Auto-Detect',
    objective: 'Objective (MCQ)',
    theory: 'Theory',
    calculation: 'Calculation',
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden" onPaste={handlePaste}>
      {/* Left Panel - Image Upload */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <FiHelpCircle className="text-amber-500" />
                Question Solver
              </h2>
              <p className="text-xs text-surface-500 mt-0.5">
                Upload an image with any question — get instant answers
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={solverMode}
                onChange={(e) => setSolverMode(e.target.value as SolverMode)}
                className="text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1.5"
              >
                {Object.entries(modeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 space-y-4">
          {/* Camera Modal */}
          {showCamera && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-surface-800 rounded-2xl overflow-hidden w-full max-w-lg animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                  <h3 className="font-semibold text-sm">Camera Capture</h3>
                  <button onClick={stopCamera} className="btn-ghost p-1">
                    <FiX size={18} />
                  </button>
                </div>
                <div className="relative bg-black">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex justify-center gap-4 p-4">
                  <button onClick={capturePhoto} className="btn-primary flex items-center gap-2">
                    <FiCamera size={16} />
                    Capture
                  </button>
                  <button onClick={stopCamera} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!image ? (
            <div
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 scale-[1.02]'
                  : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              />

              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FiUpload size={28} className="text-amber-500" />
              </div>

              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Upload a Question Image
              </h3>
              <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 max-w-sm mx-auto">
                Drag & drop an image, paste from clipboard (Ctrl+V), or use the buttons below.
                Supports JPG, PNG, and other image formats.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiImage size={16} />
                  Choose File
                </button>
                <button onClick={startCamera} className="btn-secondary flex items-center gap-2">
                  <FiCamera size={16} />
                  Take Photo
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 justify-center text-xs text-surface-400">
                <span className="flex items-center gap-1">
                  <FiFileText size={12} /> Phone camera
                </span>
                <span className="flex items-center gap-1">
                  <FiImage size={12} /> Gallery / Files
                </span>
                <span className="flex items-center gap-1">
                  <FiUpload size={12} /> Drag & drop
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700">
                <img
                  src={image}
                  alt="Question"
                  className="w-full max-h-[400px] object-contain bg-surface-100 dark:bg-surface-800"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Additional instructions */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  placeholder="Optional: Add specific instructions (e.g., 'Show step-by-step solution')"
                  className="input-field text-sm flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
                />
                <button
                  onClick={handleSolve}
                  disabled={isSolving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSolving ? (
                    <FiLoader size={16} className="animate-spin" />
                  ) : (
                    <FiSend size={16} />
                  )}
                  {isSolving ? 'Solving...' : 'Solve'}
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {['Show step-by-step solution', 'Explain in simple terms', 'What subject is this?'].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setAdditionalPrompt(q)
                      handleSolve()
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Solution Display */}
          {solution && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <FiCheckCircle size={18} />
                <span className="font-semibold text-sm">Answer Found</span>
                <span className="text-xs text-surface-400 ml-auto">
                  {solution.subject} • {solution.questionType}
                </span>
              </div>

              <div className="card border-green-200 dark:border-green-800/50">
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatAnswer(solution.answer) }} />
              </div>

              {solution.explanation && (
                <div className="card bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50">
                  <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <FiBookOpen size={14} />
                    Explanation
                  </h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatAnswer(solution.explanation) }} />
                </div>
              )}

              {/* Follow-up */}
              <FollowUpChat messages={followUpMessages} onSend={handleFollowUp} />
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="px-4 sm:px-6 pb-4">
            <h4 className="text-sm font-semibold text-surface-500 mb-2 flex items-center gap-2">
              <FiRefreshCw size={14} />
              Recent Solutions
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {history.slice(1, 6).map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setImage(h.imageUrl)
                    setSolution(h)
                  }}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 hover:border-primary-500 transition-colors"
                >
                  <img src={h.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FollowUpChat({ messages, onSend }: { messages: any[]; onSend: (q: string) => void }) {
  const [input, setInput] = useState('')

  return (
    <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
      <h4 className="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-3">
        Ask a follow-up question
      </h4>
      {messages.length > 0 && (
        <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Can you explain step 3 in more detail?"
          className="input-field text-sm flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onSend(input.trim())
              setInput('')
            }
          }}
        />
        <button
          onClick={() => {
            if (input.trim()) {
              onSend(input.trim())
              setInput('')
            }
          }}
          disabled={!input.trim()}
          className="btn-primary p-2"
        >
          <FiSend size={16} />
        </button>
      </div>
    </div>
  )
}

function formatAnswer(text: string): string {
  if (!text) return ''
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-surface-100 dark:bg-surface-800 rounded-lg p-3 overflow-x-auto text-sm font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>')
}
