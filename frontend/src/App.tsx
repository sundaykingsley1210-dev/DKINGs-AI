import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useSettingsStore } from '@/store/settingsStore'
import { useEffect } from 'react'
import Layout from '@/components/Layout/Layout'
import InstallPrompt from '@/components/InstallPrompt'
import ChatPage from '@/pages/ChatPage'
import CodePage from '@/pages/CodePage'
import CreativePage from '@/pages/CreativePage'
import SearchPage from '@/pages/SearchPage'
import QuestionSolverPage from '@/pages/QuestionSolverPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import SettingsPage from '@/pages/SettingsPage'
import DownloadPage from '@/pages/DownloadPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

export default function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-surface-800 dark:text-surface-100',
          duration: 3000,
        }}
      />
      <InstallPrompt />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/code" element={<CodePage />} />
          <Route path="/creative" element={<CreativePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/solve" element={<QuestionSolverPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
