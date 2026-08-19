import { z } from 'zod'

const objectIdSchema = z.string()
  .min(1, { message: 'worker_id is required' })
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'worker_id must be a valid id' });

const dateSchema = z.iso.date({ message: 'date must be a valid date (YYYY-MM-DD)' });
const dateTimeSchema = z.iso.datetime({ message: 'must be a valid ISO datetime' });

export const createAttendanceSchema = z.object({
  worker_id: objectIdSchema,
  date: dateSchema,
  status: z.enum(['present', 'absent', 'excused']).default('present'),
  check_in: dateTimeSchema.optional(),
  check_out: dateTimeSchema.optional()
});

export const bulkAttendanceSchema = z.object({
  date: dateSchema,
  records: z.array(z.object({
    worker_id: objectIdSchema,
    status: z.enum(['present', 'absent', 'excused']).default('present'),
    check_in: dateTimeSchema.optional(),
    check_out: dateTimeSchema.optional()
  })).min(1, { message: 'At least one attendance record is required' })
    .max(500, { message: 'Cannot submit more than 500 attendance records at once' })
});


export const getAttendanceByDateQuerySchema = z.object({
  date: z.iso.date({ message: 'provide a date query parameter (YYYY-MM-DD)' })
})


export const getWorkerAttendanceQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12)
});

export const getWorkerAttendanceParamsSchema  = z.object({
  id: z.string()
    .min(1, { message: 'id is required' })
    .regex(/^[0-9a-fA-F]{24}$/, { message: 'id must be a valid id' })
})


export const getMonthlySummaryQuerySchema = z.object({
  months: z.coerce.number().int().positive().max(12)
})