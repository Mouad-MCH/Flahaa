import { z } from 'zod';

export const createFarmSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).max(100),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal(''))
});