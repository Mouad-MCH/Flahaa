import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const objectIdSchema = z.string()
  .min(1, { message: 'worker_id is required' })
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'worker_id must be a valid id' });


export const createTaskSchema = z.object({
    worker_ids: z
       .array(objectId)
       .min(1, 'At least one worker is required')
       .max(50, 'A task cannot have more than 50 workers'),
    title: z.string().min(2, 'Title must be at least 2 characters').max(200),
    description: z.string().max(1000).optional().or(z.literal('')),
    date: z.string().min(1, 'Date is required')
})

export const getTasksQuerySchema = z.object({
    date: z.iso.date({ message: 'provide a date query parameter (YYYY-MM-DD)' }).optional(),
    worker_id: objectIdSchema.optional(),
    status: z.enum(['pending', 'in_progress', 'done']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
})

export const getMyTasksQuerySchema = getTasksQuerySchema.omit({ worker_id: true });

export const getTasksByWorkerQuerySchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    status: z.enum(['pending', 'in_progress', 'done']),
})

export const getTasksByWorkerParamsSchema = z.object({
    worker_id: objectIdSchema
})

export const addAssigneesSchema = z.object({
  worker_ids: z.array(objectId).min(1, 'At least one worker is required').max(50)
});

export const removeAssigneeParamSchema = z.object({
    worker_id: objectIdSchema,
    id: objectId
});


export const addAssigneesParamsSchema = z.object({
    id: objectId
});


export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'done'])
});
export const updateAssignmentStatusParamsSchema = removeAssigneeParamSchema.omit();


export const rateAssignmentSchema = z.object({
  rating: z.number().int().min(1).max(5),
  note: z.string().max(500).optional().or(z.literal(''))
});

export const rateAssignmentParamsSchema = removeAssigneeParamSchema.omit()

export const deleteTaskParamsSchema = addAssigneesParamsSchema.omit()