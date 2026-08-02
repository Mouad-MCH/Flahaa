import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["admin", "supervisor", "worker"]),
    farm_name: z.string().optional(),
    farm_id: z.string().optional(),
    CIN: z.string().optional(),
}).refine(
    (data) => data.role !== "admin" || Boolean(data.farm_name),
    {message: 'farm_name is required when role is admin', path: ['farm_name']}
).refine(
    (data) => data.role !== "supervisor" || Boolean(data.farm_id),
    { message: "farm_id is required when role is supervisor or worker", path: ['farm_id'] }
).refine(
    (data) => data.role !== "worker" || (Boolean(data.farm_id) && Boolean(data.CIN)),
    { message: 'farm_id and CIN are required when role is worker', path: ['CIN'] }
)

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});