import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const optionalString = z.string().optional().transform(v => v === '' ? undefined : v);

export const createWorkerSchema = z.object({
    name: z.string().min(3, "Name must be least 3 characters"),
    CIN: z.string().min(3, { message: 'CIN must be at least 3 characters long' }),
    phone: optionalString,
    address: optionalString,
    avatar: optionalString,
    contract_type: z.enum(['daily', 'weekly']).default('daily'),
    daily_rate: z.coerce.number().positive({ message: 'Daily rate must be greater than 0' }),
    status: z.enum(['active', 'inactive']).default('active'),
    join_date: optionalString,
    supervisor_id: objectId.nullable().optional().or(z.literal(''))
})

export const updateWorkerSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  CIN: z.string().min(3).optional(),
  phone: optionalString,
  address: optionalString,
  avatar: optionalString,
  contract_type: z.enum(['daily', 'weekly']).optional(),
  daily_rate: z.coerce.number().positive({ message: 'Daily rate must be greater than 0' }).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  join_date: optionalString,
  supervisor_id: objectId.nullable().optional().or(z.literal(''))
});


export const workerIdParamSchema = z.object({
  id: objectId
});

export const listWorkersQuerySchema = z.object({
  farm_id: objectId,
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const QueyCreateWorkerSchema = z.object({ farm_id: objectId })