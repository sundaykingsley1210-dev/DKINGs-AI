import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward, FiScissors, FiVolume2,
  FiVolumeX, FiUpload, FiPlus, FiTrash2, FiCopy, FiChevronUp, FiChevronDown,
  FiMaximize2, FiMinimize2, FiX, FiCheck, FiSettings, FiType, FiFilm,
  FiZap, FiMusic, FiSun, FiSliders,
} from 'react-icons/fi'

interface VideoClip {
  id: string
  name: string
  url: string
  duration: number
  startTime: number
  endTime: number
  speed: number
  volume: number
  muted: boolean
  filters: FilterState
  textOverlays: TextOverlay[]
}

interface TextOverlay {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  startFrame: number
  endFrame: number
  animation: 'none' | 'fade' | 'slide' | 'bounce'
}

interface FilterState {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
  hueRotate: number
  invert: number
}

let clipIdCounter = 0
function generateId(): string {
  return `${Date.now()}-${++clipIdCounter}`
}

const defaultFilters = (): FilterState => ({
  brightness: 100, contrast: 100, saturation: 100, blur: 0,
  grayscale: 0, sepia: 0, hueRotate: 0, invert: 0,
})

const PRESET_FILTERS: { name: string; values: FilterState }[] = [
  { name: 'Normal', values: { brightness: 100, contrast: 100, saturation: 100, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0 } },
  { name: 'Vivid', values: { brightness: 105, contrast: 120, saturation: 140, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0 } },
  { name: 'Warm', values: { brightness: 105, contrast: 105, saturation: 110, blur: 0, grayscale: 0, sepia: 30, hueRotate: 10, invert: 0 } },
  { name: 'Cool', values: { brightness: 100, contrast: 110, saturation: 90, blur: 0, grayscale: 0, sepia: 0, hueRotate: 180, invert: 0 } },
  { name: 'B&W', values: { brightness: 110, contrast: 120, saturation: 0, blur: 0, grayscale: 100, sepia: 0, hueRotate: 0, invert: 0 } },
  { name: 'Vintage', values: { brightness: 110, contrast: 90, saturation: 80, blur: 0, grayscale: 0, sepia: 50, hueRotate: -10, invert: 0 } },
  { name: 'Dramatic', values: { brightness: 90, contrast: 150, saturation: 80, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0 } },
  { name: 'Fade', values: { brightness: 120, contrast: 80, saturation: 70, blur: 0.5, grayscale: 0, sepia: 10, hueRotate: 0, invert: 0 } },
  { name: 'Sharp', values: { brightness: 105, contrast: 130, saturation: 110, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0 } },
  { name: 'Noir', values: { brightness: 95, contrast: 140, saturation: 0, blur: 0, grayscale: 100, sepia: 20, hueRotate: 0, invert: 0 } },
]

const FONT_FAMILIES = [
  'Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
  'Courier New', 'Verdana', 'Impact', 'Comic Sans MS', 'Trebuchet MS',
]

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00.000'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

function buildFilterCSS(f: FilterState): string {
  return [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturation}%)`,
    f.blur > 0 ? `blur(${f.blur}px)` : '',
    `grayscale(${f.grayscale}%)`,
    `sepia(${f.sepia}%)`,
    `hue-rotate(${f.hueRotate}deg)`,
    `invert(${f.invert}%)`,
  ].filter(Boolean).join(' ')
}

function Slider({
  label, value, min, max, step, onChange, unit = '',
}: {
  label: string; value: number; min: number; max: number
  step?: number; onChange: (v: number) => void; unit?: string
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-surface-400 mb-1">
        <span>{label}</span>
        <span>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  )
}

function ColorPicker({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs text-surface-400 w-20">{label}</span>
      <input
        type="color"
        value={value === 'transparent' ? '#000000' : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-surface-600 cursor-pointer bg-transparent"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-surface-800 border border-surface-600 rounded px-2 py-1 text-xs text-surface-200 font-mono"
      />
    </div>
  )
}

export default function VideoEditorPage() {
  const [clips, setClips] = useState<VideoClip[]>([])
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [rightTab, setRightTab] = useState<'edit' | 'text' | 'filters' | 'speed' | 'audio'>('edit')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [audioTrackUrl, setAudioTrackUrl] = useState<string | null>(null)
  const [audioTrackName, setAudioTrackName] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const exportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const selectedClip = useMemo(
    () => clips.find((c) => c.id === selectedClipId) ?? null,
    [clips, selectedClipId],
  )

  const totalDuration = useMemo(
    () => clips.reduce((sum, c) => sum + (c.endTime - c.startTime) / c.speed, 0),
    [clips],
  )

  const addClips = useCallback((files: FileList | null) => {
    if (!files) return
    const newClips: VideoClip[] = []
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) return
      const url = URL.createObjectURL(file)
      newClips.push({
        id: generateId(), name: file.name, url, duration: 0,
        startTime: 0, endTime: 0, speed: 1, volume: 1, muted: false,
        filters: defaultFilters(), textOverlays: [],
      })
    })
    setClips((prev) => {
      const updated = [...prev, ...newClips]
      newClips.forEach((clip) => {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => {
          setClips((curr) =>
            curr.map((c) =>
              c.id === clip.id ? { ...c, duration: v.duration, endTime: v.duration } : c,
            ),
          )
        }
        v.src = clip.url
      })
      return updated
    })
  }, [])

  const removeClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id))
    setSelectedClipId((prev) => (prev === id ? null : prev))
  }, [])

  const duplicateClip = useCallback((id: string) => {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      if (idx === -1) return prev
      const original = prev[idx]
      const dup: VideoClip = {
        ...original,
        id: generateId(),
        name: `${original.name} (copy)`,
        textOverlays: original.textOverlays.map((t) => ({ ...t, id: generateId() })),
      }
      const next = [...prev]
      next.splice(idx + 1, 0, dup)
      return next
    })
  }, [])

  const moveClip = useCallback((id: string, direction: 'up' | 'down') => {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === id)
      if (idx === -1) return prev
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }, [])

  const updateClip = useCallback((id: string, patch: Partial<VideoClip>) => {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const splitClip = useCallback(() => {
    if (!selectedClip) return
    const vid = videoRef.current
    const elapsed = vid ? vid.currentTime : currentTime
    if (elapsed <= selectedClip.startTime || elapsed >= selectedClip.endTime) return

    const firstHalf: VideoClip = {
      ...selectedClip,
      id: generateId(),
      name: `${selectedClip.name} (1)`,
      endTime: elapsed,
      textOverlays: selectedClip.textOverlays.map((t) => ({ ...t, id: generateId() })),
    }
    const secondHalf: VideoClip = {
      ...selectedClip,
      id: generateId(),
      name: `${selectedClip.name} (2)`,
      startTime: elapsed,
      textOverlays: selectedClip.textOverlays.map((t) => ({ ...t, id: generateId() })),
    }

    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === selectedClip.id)
      if (idx === -1) return prev
      const next = [...prev]
      next.splice(idx, 1, firstHalf, secondHalf)
      return next
    })
    setSelectedClipId(secondHalf.id)
  }, [selectedClip, currentTime])

  const addTextOverlay = useCallback(() => {
    if (!selectedClipId) return
    const overlay: TextOverlay = {
      id: generateId(), text: 'New Text', x: 50, y: 50,
      fontSize: 24, fontFamily: 'Inter', color: '#ffffff',
      backgroundColor: 'transparent', startFrame: 0, endFrame: 100,
      animation: 'none',
    }
    setClips((prev) =>
      prev.map((c) =>
        c.id === selectedClipId ? { ...c, textOverlays: [...c.textOverlays, overlay] } : c,
      ),
    )
  }, [selectedClipId])

  const updateTextOverlay = useCallback(
    (clipId: string, overlayId: string, patch: Partial<TextOverlay>) => {
      setClips((prev) =>
        prev.map((c) =>
          c.id === clipId
            ? { ...c, textOverlays: c.textOverlays.map((t) => t.id === overlayId ? { ...t, ...patch } : t) }
            : c,
        ),
      )
    },
    [],
  )

  const removeTextOverlay = useCallback((clipId: string, overlayId: string) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === clipId
          ? { ...c, textOverlays: c.textOverlays.filter((t) => t.id !== overlayId) }
          : c,
      ),
    )
  }, [])

  const togglePlay = useCallback(() => {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      vid.play().catch(() => {})
      setIsPlaying(true)
    } else {
      vid.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = useCallback((time: number) => {
    setCurrentTime(time)
    const vid = videoRef.current
    if (vid) vid.currentTime = time
  }, [])

  const skipForward = useCallback(() => {
    seek(Math.min(currentTime + 5, totalDuration))
  }, [currentTime, totalDuration, seek])

  const skipBackward = useCallback(() => {
    seek(Math.max(currentTime - 5, 0))
  }, [currentTime, seek])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    const onTimeUpdate = () => setCurrentTime(vid.currentTime)
    const onEnded = () => setIsPlaying(false)
    vid.addEventListener('timeupdate', onTimeUpdate)
    vid.addEventListener('ended', onEnded)
    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate)
      vid.removeEventListener('ended', onEnded)
    }
  }, [selectedClipId])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const startExport = useCallback(() => {
    setShowExportModal(true)
    setIsExporting(true)
    setExportProgress(0)
    let progress = 0
    exportIntervalRef.current = setInterval(() => {
      progress += Math.random() * 8 + 2
      if (progress >= 100) {
        progress = 100
        if (exportIntervalRef.current) clearInterval(exportIntervalRef.current)
        setIsExporting(false)
      }
      setExportProgress(Math.min(progress, 100))
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (exportIntervalRef.current) clearInterval(exportIntervalRef.current)
    }
  }, [])

  const handleAudioUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const url = URL.createObjectURL(file)
    setAudioTrackUrl(url)
    setAudioTrackName(file.name)
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const activeVideoSrc = selectedClip?.url ?? null

  const tabs = [
    { key: 'edit' as const, icon: FiSliders, label: 'Edit' },
    { key: 'text' as const, icon: FiType, label: 'Text' },
    { key: 'filters' as const, icon: FiSun, label: 'Filters' },
    { key: 'speed' as const, icon: FiZap, label: 'Speed' },
    { key: 'audio' as const, icon: FiMusic, label: 'Audio' },
  ]

  return (
    <div className="h-screen flex flex-col bg-surface-900 text-surface-200 overflow-hidden select-none">
      {audioTrackUrl && <audio ref={audioRef} src={audioTrackUrl} loop />}

      {/* Top bar */}
      <header className="flex items-center justify-between h-12 px-4 bg-surface-800 border-b border-surface-700 shrink-0">
        <div className="flex items-center gap-2">
          <FiFilm className="text-primary-500 text-lg" />
          <span className="font-semibold text-sm">Dkings AI Video Editor</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-400">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <button
            onClick={startExport}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
          >
            <FiUpload size={12} />
            Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Clip list */}
        <aside className="w-56 bg-surface-800 border-r border-surface-700 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700">
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">Clips</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-surface-400 hover:text-primary-400 transition-colors"
              title="Add clips"
            >
              <FiPlus size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => addClips(e.target.files)}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {clips.length === 0 && (
              <div className="text-center text-surface-500 text-xs mt-8">
                <FiFilm className="mx-auto mb-2 text-2xl opacity-40" />
                <p>No clips yet</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-primary-400 hover:text-primary-300 underline text-xs"
                >
                  Upload videos
                </button>
              </div>
            )}
            {clips.map((clip, idx) => (
              <div
                key={clip.id}
                onClick={() => setSelectedClipId(clip.id)}
                className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedClipId === clip.id
                    ? 'bg-primary-600/20 border border-primary-500/40'
                    : 'bg-surface-700/50 hover:bg-surface-700 border border-transparent'
                }`}
              >
                <div className="w-10 h-7 bg-surface-900 rounded flex items-center justify-center overflow-hidden shrink-0">
                  <FiFilm className="text-surface-500 text-xs" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate text-surface-200">{clip.name}</p>
                  <p className="text-[10px] text-surface-500">{formatTime(clip.duration)}</p>
                </div>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveClip(clip.id, 'up') }}
                    className="text-surface-400 hover:text-surface-200"
                    disabled={idx === 0}
                  >
                    <FiChevronUp size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveClip(clip.id, 'down') }}
                    className="text-surface-400 hover:text-surface-200"
                    disabled={idx === clips.length - 1}
                  >
                    <FiChevronDown size={10} />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateClip(clip.id) }}
                    className="text-surface-400 hover:text-primary-400"
                    title="Duplicate"
                  >
                    <FiCopy size={10} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeClip(clip.id) }}
                    className="text-surface-400 hover:text-red-400"
                    title="Remove"
                  >
                    <FiTrash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Preview */}
        <main ref={containerRef} className="flex-1 flex flex-col bg-black relative">
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {activeVideoSrc ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={activeVideoSrc}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    filter: selectedClip ? buildFilterCSS(selectedClip.filters) : undefined,
                  }}
                />
                {selectedClip?.textOverlays.map((overlay) => {
                  const visible = currentTime >= overlay.startFrame && currentTime <= overlay.endFrame
                  if (!visible) return null
                  const animClass =
                    overlay.animation === 'fade'
                      ? 'animate-fade-in'
                      : overlay.animation === 'slide'
                      ? 'animate-slide-up'
                      : overlay.animation === 'bounce'
                      ? 'animate-bounce'
                      : ''
                  return (
                    <div
                      key={overlay.id}
                      className={`absolute pointer-events-none ${animClass}`}
                      style={{
                        left: `${overlay.x}%`,
                        top: `${overlay.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${overlay.fontSize}px`,
                        fontFamily: overlay.fontFamily,
                        color: overlay.color,
                        backgroundColor: overlay.backgroundColor === 'transparent' ? undefined : overlay.backgroundColor,
                        padding: overlay.backgroundColor !== 'transparent' ? '4px 8px' : undefined,
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                      }}
                    >
                      {overlay.text}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-surface-500 text-center">
                <FiFilm className="mx-auto mb-3 text-4xl opacity-30" />
                <p className="text-sm">Select a clip to preview</p>
                <p className="text-xs text-surface-600 mt-1">or upload videos to get started</p>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="bg-surface-800 border-t border-surface-700 px-4 py-2 shrink-0">
            <div className="mb-2">
              <input
                type="range"
                min={0}
                max={totalDuration || 1}
                step={0.01}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-400 font-mono w-24">
                {formatTime(currentTime)}
              </span>

              <div className="flex items-center gap-3">
                <button onClick={skipBackward} className="text-surface-400 hover:text-surface-200 transition-colors">
                  <FiSkipBack size={16} />
                </button>
                <button
                  onClick={splitClip}
                  className="text-surface-400 hover:text-yellow-400 transition-colors"
                  title="Split at playhead"
                  disabled={!selectedClip}
                >
                  <FiScissors size={16} />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-600 hover:bg-primary-500 text-white transition-colors"
                >
                  {isPlaying ? <FiPause size={16} /> : <FiPlay size={16} className="ml-0.5" />}
                </button>
                <button onClick={skipForward} className="text-surface-400 hover:text-surface-200 transition-colors">
                  <FiSkipForward size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 w-24 justify-end">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-surface-400 hover:text-surface-200 transition-colors"
                >
                  {isMuted ? <FiVolumeX size={14} /> : <FiVolume2 size={14} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value))
                    if (isMuted) setIsMuted(false)
                  }}
                  className="w-16 h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <button
                  onClick={toggleFullscreen}
                  className="text-surface-400 hover:text-surface-200 transition-colors"
                >
                  {isFullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right panel: Tools */}
        <aside className="w-72 bg-surface-800 border-l border-surface-700 flex flex-col shrink-0">
          <div className="flex border-b border-surface-700">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setRightTab(key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  rightTab === key
                    ? 'text-primary-400 border-b-2 border-primary-500'
                    : 'text-surface-500 hover:text-surface-300'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {!selectedClip ? (
              <div className="text-center text-surface-500 text-xs mt-12">
                <FiSettings className="mx-auto mb-2 text-2xl opacity-30" />
                <p>Select a clip to edit</p>
              </div>
            ) : (
              <>
                {/* Edit Tab */}
                {rightTab === 'edit' && (
                  <div>
                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
                      Trim & Timing
                    </h3>
                    <Slider
                      label="Start"
                      value={selectedClip.startTime}
                      min={0}
                      max={selectedClip.duration}
                      step={0.01}
                      onChange={(v) => updateClip(selectedClip.id, { startTime: v })}
                      unit="s"
                    />
                    <Slider
                      label="End"
                      value={selectedClip.endTime}
                      min={0}
                      max={selectedClip.duration}
                      step={0.01}
                      onChange={(v) => updateClip(selectedClip.id, { endTime: v })}
                      unit="s"
                    />

                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3 mt-4">
                      Volume
                    </h3>
                    <Slider
                      label="Volume"
                      value={selectedClip.volume}
                      min={0}
                      max={2}
                      step={0.01}
                      onChange={(v) => updateClip(selectedClip.id, { volume: v })}
                    />
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={selectedClip.muted}
                        onChange={(e) => updateClip(selectedClip.id, { muted: e.target.checked })}
                        className="accent-primary-500"
                        id="clip-muted"
                      />
                      <label htmlFor="clip-muted" className="text-xs text-surface-400">Mute clip</label>
                    </div>
                  </div>
                )}

                {/* Text Tab */}
                {rightTab === 'text' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                        Text Overlays
                      </h3>
                      <button
                        onClick={addTextOverlay}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                        title="Add text"
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>

                    {selectedClip.textOverlays.length === 0 && (
                      <p className="text-xs text-surface-500 text-center mt-6">
                        No text overlays. Click + to add.
                      </p>
                    )}

                    {selectedClip.textOverlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className="bg-surface-700/50 rounded-lg p-3 mb-3 border border-surface-600"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={overlay.text}
                            onChange={(e) => updateTextOverlay(selectedClip.id, overlay.id, { text: e.target.value })}
                            className="bg-surface-800 border border-surface-600 rounded px-2 py-1 text-xs text-surface-200 flex-1 mr-2"
                          />
                          <button
                            onClick={() => removeTextOverlay(selectedClip.id, overlay.id)}
                            className="text-surface-500 hover:text-red-400 transition-colors"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>

                        <Slider
                          label="X Position"
                          value={overlay.x}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { x: v })}
                          unit="%"
                        />
                        <Slider
                          label="Y Position"
                          value={overlay.y}
                          min={0}
                          max={100}
                          step={1}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { y: v })}
                          unit="%"
                        />
                        <Slider
                          label="Font Size"
                          value={overlay.fontSize}
                          min={8}
                          max={120}
                          step={1}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { fontSize: v })}
                          unit="px"
                        />

                        <div className="mb-3">
                          <label className="text-xs text-surface-400 block mb-1">Font</label>
                          <select
                            value={overlay.fontFamily}
                            onChange={(e) => updateTextOverlay(selectedClip.id, overlay.id, { fontFamily: e.target.value })}
                            className="w-full bg-surface-800 border border-surface-600 rounded px-2 py-1 text-xs text-surface-200"
                          >
                            {FONT_FAMILIES.map((f) => (
                              <option key={f} value={f} style={{ fontFamily: f }}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>

                        <ColorPicker
                          label="Text Color"
                          value={overlay.color}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { color: v })}
                        />
                        <ColorPicker
                          label="Background"
                          value={overlay.backgroundColor}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { backgroundColor: v })}
                        />

                        <Slider
                          label="Start Time"
                          value={overlay.startFrame}
                          min={0}
                          max={selectedClip.duration}
                          step={0.01}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { startFrame: v })}
                          unit="s"
                        />
                        <Slider
                          label="End Time"
                          value={overlay.endFrame}
                          min={0}
                          max={selectedClip.duration}
                          step={0.01}
                          onChange={(v) => updateTextOverlay(selectedClip.id, overlay.id, { endFrame: v })}
                          unit="s"
                        />

                        <div className="mb-3">
                          <label className="text-xs text-surface-400 block mb-1">Animation</label>
                          <select
                            value={overlay.animation}
                            onChange={(e) =>
                              updateTextOverlay(selectedClip.id, overlay.id, {
                                animation: e.target.value as TextOverlay['animation'],
                              })
                            }
                            className="w-full bg-surface-800 border border-surface-600 rounded px-2 py-1 text-xs text-surface-200"
                          >
                            <option value="none">None</option>
                            <option value="fade">Fade</option>
                            <option value="slide">Slide</option>
                            <option value="bounce">Bounce</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Filters Tab */}
                {rightTab === 'filters' && (
                  <div>
                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
                      Preset Filters
                    </h3>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {PRESET_FILTERS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => updateClip(selectedClip.id, { filters: { ...preset.values } })}
                          className="text-center group"
                        >
                          <div
                            className="w-full aspect-square rounded border border-surface-600 mb-1 group-hover:border-primary-500 transition-colors"
                            style={{ filter: buildFilterCSS(preset.values) }}
                          >
                            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-surface-600 rounded" />
                          </div>
                          <span className="text-[9px] text-surface-400 group-hover:text-surface-200">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
                      Custom Filters
                    </h3>
                    <Slider
                      label="Brightness"
                      value={selectedClip.filters.brightness}
                      min={0}
                      max={200}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, brightness: v } })}
                      unit="%"
                    />
                    <Slider
                      label="Contrast"
                      value={selectedClip.filters.contrast}
                      min={0}
                      max={200}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, contrast: v } })}
                      unit="%"
                    />
                    <Slider
                      label="Saturation"
                      value={selectedClip.filters.saturation}
                      min={0}
                      max={200}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, saturation: v } })}
                      unit="%"
                    />
                    <Slider
                      label="Blur"
                      value={selectedClip.filters.blur}
                      min={0}
                      max={20}
                      step={0.5}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, blur: v } })}
                      unit="px"
                    />
                    <Slider
                      label="Grayscale"
                      value={selectedClip.filters.grayscale}
                      min={0}
                      max={100}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, grayscale: v } })}
                      unit="%"
                    />
                    <Slider
                      label="Sepia"
                      value={selectedClip.filters.sepia}
                      min={0}
                      max={100}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, sepia: v } })}
                      unit="%"
                    />
                    <Slider
                      label="Hue Rotate"
                      value={selectedClip.filters.hueRotate}
                      min={-180}
                      max={180}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, hueRotate: v } })}
                      unit="deg"
                    />
                    <Slider
                      label="Invert"
                      value={selectedClip.filters.invert}
                      min={0}
                      max={100}
                      onChange={(v) => updateClip(selectedClip.id, { filters: { ...selectedClip.filters, invert: v } })}
                      unit="%"
                    />
                  </div>
                )}

                {/* Speed Tab */}
                {rightTab === 'speed' && (
                  <div>
                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
                      Playback Speed
                    </h3>
                    <Slider
                      label="Speed"
                      value={selectedClip.speed}
                      min={0.25}
                      max={4}
                      step={0.05}
                      onChange={(v) => updateClip(selectedClip.id, { speed: v })}
                      unit="x"
                    />
                    <div className="grid grid-cols-5 gap-1.5 mt-2">
                      {SPEED_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateClip(selectedClip.id, { speed: s })}
                          className={`py-1.5 rounded text-[10px] font-medium transition-colors ${
                            selectedClip.speed === s
                              ? 'bg-primary-600 text-white'
                              : 'bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-surface-200'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio Tab */}
                {rightTab === 'audio' && (
                  <div>
                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">
                      Audio Track
                    </h3>
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-surface-600 rounded-lg p-4 text-center hover:border-primary-500 transition-colors"
                    >
                      <FiMusic className="mx-auto mb-2 text-xl text-surface-500" />
                      <p className="text-xs text-surface-400">
                        {audioTrackName || 'Upload audio track'}
                      </p>
                    </button>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleAudioUpload(e.target.files)}
                    />

                    {audioTrackUrl && (
                      <div className="mt-3 bg-surface-700/50 rounded-lg p-3 border border-surface-600">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-surface-200 truncate flex-1 mr-2">{audioTrackName}</p>
                          <button
                            onClick={() => { setAudioTrackUrl(null); setAudioTrackName('') }}
                            className="text-surface-500 hover:text-red-400 transition-colors"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (audioRef.current) {
                                if (audioRef.current.paused) audioRef.current.play().catch(() => {})
                                else audioRef.current.pause()
                              }
                            }}
                            className="text-surface-400 hover:text-surface-200 transition-colors"
                          >
                            <FiPlay size={14} />
                          </button>
                          <Slider
                            label="Audio Volume"
                            value={volume}
                            min={0}
                            max={2}
                            step={0.01}
                            onChange={(v) => setVolume(v)}
                          />
                        </div>
                      </div>
                    )}

                    <h3 className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3 mt-6">
                      Clip Volume
                    </h3>
                    <Slider
                      label="Volume"
                      value={selectedClip.volume}
                      min={0}
                      max={2}
                      step={0.01}
                      onChange={(v) => updateClip(selectedClip.id, { volume: v })}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedClip.muted}
                        onChange={(e) => updateClip(selectedClip.id, { muted: e.target.checked })}
                        className="accent-primary-500"
                        id="audio-mute"
                      />
                      <label htmlFor="audio-mute" className="text-xs text-surface-400">Mute clip</label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-surface-800 rounded-xl p-6 w-96 border border-surface-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-surface-200">Export Video</h2>
              {!isExporting && (
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-surface-400 hover:text-surface-200 transition-colors"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-surface-400 mb-1.5">
                <span>{isExporting ? 'Exporting...' : exportProgress >= 100 ? 'Complete' : 'Ready'}</span>
                <span>{Math.round(exportProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>

            {exportProgress >= 100 && !isExporting && (
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FiCheck className="text-green-400 text-xl" />
                </div>
                <p className="text-xs text-surface-400">Export completed successfully!</p>
              </div>
            )}

            <div className="flex gap-2">
              {!isExporting && (
                <button
                  onClick={() => {
                    if (exportProgress >= 100) {
                      setShowExportModal(false)
                      setExportProgress(0)
                    } else {
                      startExport()
                    }
                  }}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium py-2 rounded transition-colors"
                >
                  {exportProgress >= 100 ? 'Done' : 'Start Export'}
                </button>
              )}
              {isExporting && (
                <p className="text-xs text-surface-500 text-center w-full">
                  Please wait while the video is being processed...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
