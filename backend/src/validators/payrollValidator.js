import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const objectIdSchema = z.string()
  .min(1, { message: 'worker_id is required' })
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'worker_id must be a valid id' });


export const calculatePayrollSchema = z.object({
  worker_id: z.string().min(1, 'Worker is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  bonuses: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  notes: z.string().max(500).optional().or(z.literal(''))
});


export const getPayrollsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  worker_id: objectIdSchema.optional(),
  status: z.enum(['paid', 'pending']).optional(),
  limit: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
})

export const getPayrollByWorkerParamsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  worker_id: objectIdSchema
})

export const updatePayrollStatusBodySchema = z.object({
  status: z.enum(['paid', 'pending'])
})

export const updatePayrollStatusParamsSchema = z.object({
  id: objectId,
})

export const getMyPayrollsQuery = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  limit: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
})