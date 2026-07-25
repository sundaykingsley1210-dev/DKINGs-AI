import { Router, Request, Response } from 'express'
import { optionalAuth } from '../middleware/auth'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// In-memory project store
const projects: Map<string, any> = new Map()

// List projects
router.get('/', optionalAuth, (req: any, res: Response) => {
  const userProjects = Array.from(projects.values()).filter(
    (p) => !req.userId || p.userId === req.userId
  )
  res.json(userProjects)
})

// Create project
router.post('/', optionalAuth, (req: any, res: Response) => {
  const { name, description, mode } = req.body

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' })
  }

  const id = uuidv4()
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
  const project = {
    id,
    name,
    description: description || '',
    mode: mode || 'code',
    files: [],
    conversations: [],
    instructions: '',
    userId: req.userId || 'anonymous',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color: colors[Math.floor(Math.random() * colors.length)],
  }

  projects.set(id, project)
  res.status(201).json(project)
})

// Get project
router.get('/:id', optionalAuth, (req: Request, res: Response) => {
  const project = projects.get(req.params.id)
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }
  res.json(project)
})

// Update project
router.put('/:id', optionalAuth, (req: Request, res: Response) => {
  const project = projects.get(req.params.id)
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const updated = { ...project, ...req.body, updatedAt: new Date().toISOString() }
  projects.set(req.params.id, updated)
  res.json(updated)
})

// Delete project
router.delete('/:id', optionalAuth, (req: Request, res: Response) => {
  if (!projects.has(req.params.id)) {
    return res.status(404).json({ message: 'Project not found' })
  }
  projects.delete(req.params.id)
  res.json({ message: 'Project deleted' })
})

// Upload file to project
router.post('/:id/files', optionalAuth, (req: any, res: Response) => {
  const project = projects.get(req.params.id)
  if (!project) {
    return res.status(404).json({ message: 'Project not found' })
  }

  // Handle file upload
  const file = (req as any).file
  if (file) {
    const newFile = {
      id: uuidv4(),
      name: file.originalname,
      path: file.originalname,
      content: file.buffer?.toString() || '',
      type: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
    project.files.push(newFile)
    projects.set(req.params.id, project)
    return res.json(newFile)
  }

  res.status(400).json({ message: 'No file provided' })
})

export default router
