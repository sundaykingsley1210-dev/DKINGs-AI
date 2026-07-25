import { z } from 'zod'

export const chatMessageSchema = z.object({
  conversationId: z.string().optional(),
  content: z.string().min(1).max(50000),
  mode: z.enum(['code', 'creative', 'search', 'general']),
  context: z.object({
    projectName: z.string().optional(),
    projectDescription: z.string().optional(),
    files: z.array(z.object({
      name: z.string(),
      content: z.string(),
    })).optional(),
    instructions: z.string().optional(),
  }).optional(),
})

export const codeAnalyzeSchema = z.object({
  code: z.string().min(1).max(100000),
  language: z.string(),
  error: z.string().optional(),
})

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  category: z.enum(['all', 'code', 'docs', 'general']).optional(),
})

export const projectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  mode: z.enum(['code', 'creative', 'search', 'general']),
})

export const imageEditSchema = z.object({
  image: z.string(),
  prompt: z.string().min(1).max(2000),
})

export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: result.error.flatten().fieldErrors,
      })
    }
    req.validatedBody = result.data
    next()
  }
}
