import { useState, useCallback } from 'react'
import { FiImage, FiVideo, FiType, FiUpload, FiDownload, FiPlay, FiPause, FiStar } from 'react-icons/fi'
import ChatInput from '@/components/Chat/ChatInput'
import ChatMessage from '@/components/Chat/ChatMessage'
import toast from 'react-hot-toast'

type CreativeTab = 'image' | 'video' | 'content'

export default function CreativePage() {
  const [activeTab, setActiveTab] = useState<CreativeTab>('image')
  const [messages, setMessages] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  const tabs = [
    { id: 'image' as const, label: 'Image Editor', icon: FiImage },
    { id: 'video' as const, label: 'Video Assistant', icon: FiVideo },
    { id: 'content' as const, label: 'Content Creator', icon: FiType },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string)
      setEditedImage(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleImageEdit = async () => {
    if (!uploadedImage || !editPrompt.trim()) {
      toast.error('Please upload an image and enter an edit prompt')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/image/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: editPrompt,
        }),
      })

      const data = await response.json()
      if (data.result) {
        setEditedImage(data.result)
        toast.success('Image edited successfully!')
      } else if (data.message) {
        toast(data.message, { icon: '💡' })
      } else {
        toast.error('Image editing requires an AI image API integration')
      }
    } catch (err) {
      toast.error('Failed to process image. Check if the backend is running.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file')
      return
    }
    setVideoFile(file)
    setVideoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleCreativeChat = useCallback(async (content: string) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsProcessing(true)

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('dkings-token') || ''}`,
        },
        body: JSON.stringify({ content, mode: 'creative' }),
      })

      const data = await response.json()
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.message || 'I can help with that creative task!',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      toast.error('Failed to get response')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'image' && (
          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Image Editor Panel */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <FiStar className="text-pink-500" />
                AI Image Editor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center hover:border-primary-500 transition-colors">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Uploaded" className="max-w-full max-h-64 mx-auto rounded-lg" />
                  ) : (
                    <label className="cursor-pointer">
                      <FiUpload size={32} className="mx-auto mb-3 text-surface-400" />
                      <p className="text-sm text-surface-500">Click to upload an image</p>
                      <p className="text-xs text-surface-400 mt-1">PNG, JPG, GIF up to 50MB</p>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </label>
                  )}
                </div>

                {/* Result Area */}
                <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center">
                  {editedImage ? (
                    <img src={editedImage} alt="Edited" className="max-w-full max-h-64 mx-auto rounded-lg" />
                  ) : (
                    <div className="text-surface-400">
                      <FiImage size={32} className="mx-auto mb-3" />
                      <p className="text-sm">Edited result will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Prompt */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder='e.g., "Remove the background" or "Make it look professional"'
                  className="input-field flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleImageEdit()}
                />
                <button
                  onClick={handleImageEdit}
                  disabled={isProcessing || !uploadedImage || !editPrompt.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiStar size={16} />
                  )}
                  Edit
                </button>
              </div>

              {editedImage && (
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = editedImage
                    a.download = 'edited-image.png'
                    a.click()
                  }}
                  className="btn-secondary flex items-center gap-2 w-fit"
                >
                  <FiDownload size={16} />
                  Download Edited Image
                </button>
              )}
            </div>

            {/* Chat Panel */}
            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-surface-200 dark:border-surface-700 flex flex-col max-h-[50vh] lg:max-h-none">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <h3 className="font-semibold text-sm">Creative Assistant</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
              <ChatInput onSend={handleCreativeChat} disabled={isProcessing} placeholder="Ask about image editing..." />
            </div>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                <FiVideo className="text-purple-500" />
                Video Assistant
              </h3>

              <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center mb-4">
                {videoPreview ? (
                  <video src={videoPreview} controls className="max-w-full max-h-80 mx-auto rounded-lg" />
                ) : (
                  <label className="cursor-pointer">
                    <FiUpload size={32} className="mx-auto mb-3 text-surface-400" />
                    <p className="text-sm text-surface-500">Click to upload a video</p>
                    <p className="text-xs text-surface-400 mt-1">MP4, MOV, AVI up to 500MB</p>
                    <input type="file" onChange={handleVideoUpload} className="hidden" accept="video/*" />
                  </label>
                )}
              </div>

              {videoFile && (
                <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-sm mb-2">Video Info</h4>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Name: {videoFile.name}<br />
                    Size: {(videoFile.size / 1024 / 1024).toFixed(2)} MB<br />
                    Type: {videoFile.type}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Create video script',
                  'Generate storyboard',
                  'Suggest transitions',
                  'Create captions',
                  'Video titles & hashtags',
                  'Content ideas for social media',
                ].map((feature) => (
                  <button
                    key={feature}
                    onClick={() => handleCreativeChat(feature)}
                    className="card hover:bg-surface-50 dark:hover:bg-surface-700/50 text-left text-sm transition-all"
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-surface-200 dark:border-surface-700 flex flex-col max-h-[50vh] lg:max-h-none">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <h3 className="font-semibold text-sm">Video Assistant</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
              </div>
              <ChatInput onSend={handleCreativeChat} disabled={isProcessing} placeholder="Ask about video editing..." />
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="flex h-full">
            <div className="flex-1 flex flex-col">
              <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <FiType className="text-cyan-500" />
                  Content Creator
                </h3>
                <p className="text-sm text-surface-500 mt-1">
                  Generate scripts, captions, hashtags, and content ideas for any platform
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Write a YouTube video script about web development tips',
                      'Create Instagram captions for a tech brand',
                      'Generate TikTok content ideas for a coding channel',
                      'Create a blog post outline about AI in 2024',
                      'Write email marketing copy for a SaaS product',
                      'Create a content calendar for one month',
                      'Generate hashtags for a photography account',
                      'Write a product description for an app',
                    ].map((idea) => (
                      <button
                        key={idea}
                        onClick={() => handleCreativeChat(idea)}
                        className="card hover:bg-surface-50 dark:hover:bg-surface-700/50 text-left text-sm transition-all"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))
                )}
              </div>

              <ChatInput onSend={handleCreativeChat} disabled={isProcessing} placeholder="Describe what content you need..." />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
