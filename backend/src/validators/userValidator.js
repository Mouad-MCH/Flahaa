import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createSupervisorSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }).lowercase(),
    phone: z.string().optional(),
})

export const supervisorIdSchema = z.object({
    id: objectId
})

export const updateSupervisorSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }).optional(),
    phone: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }).lowercase().optional(),
    status: z.enum(['active', 'inactive'], { message: "Status must be either 'active' or 'inactive'" }).optional()
})