import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { generateToken } from '../middleware/auth'

const router = Router()

// In-memory user store (replace with MongoDB/PostgreSQL in production)
const users: Map<string, { id: string; name: string; email: string; password: string; createdAt: string }> = new Map()

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    // Check if user exists
    for (const user of users.values()) {
      if (user.email === email) {
        return res.status(400).json({ message: 'Email already registered' })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const userId = uuidv4()

    users.set(userId, {
      id: userId,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    })

    const token = generateToken(userId, email)

    res.status(201).json({
      token,
      user: { id: userId, name, email },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    let foundUser = null
    for (const user of users.values()) {
      if (user.email === email) {
        foundUser = user
        break
      }
    }

    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(foundUser.id, foundUser.email)

    res.json({
      token,
      user: { id: foundUser.id, name: foundUser.name, email: foundUser.email },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// Get profile
router.get('/profile', (req: any, res: Response) => {
  try {
    const user = users.get(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt })
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile' })
  }
})

export default router
