import { z } from 'zod'

export const createAttendanceSchema = z.object({
  worker_id: z.string().min(1, { message: 'worker_id is required' }),
  date: z.string().min(1, { message: 'date is required' }),
  status: z.enum(['present', 'absent', 'excused']).default('present'),
  check_in: z.string().optional().or(z.literal('')),
  check_out: z.string().optional().or(z.literal(''))
});

export const bulkAttendanceSchema = z.object({
  date: z.string().min(1, { message: 'date is required' }),
  records: z.array(z.object({
    worker_id: z.string().min(1),
    status: z.enum(['present', 'absent', 'excused']).default('present'),
    check_in: z.string().optional().or(z.literal('')),
    check_out: z.string().optional().or(z.literal(''))
  })).min(1, { message: 'At least one attendance record is required' })
});


export const getAttendanceByDateQuerySchema = z.object({
  date: z.string().min(1, { message: 'provide a date query parameter (YYYY-MM-DD)' })
})


export const getWorkerAttendanceQuerySchema = z.object({
  year: z.coerce.number().positive(),
  month: z.coerce.number().min(1).max(12)
});

export const getWorkerAttendanceParamsSchema  = z.object({
  id: z.string().min(1)
})


export const getMonthlySummaryQuerySchema = z.object({
  months: z.coerce.number().positive().max(12)
})