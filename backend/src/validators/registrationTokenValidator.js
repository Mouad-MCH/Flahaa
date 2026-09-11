import {z} from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const registrationTokenSchema = z.discriminatedUnion("role", [
    z.object({
        role: z.literal("supervisor"),
        name: z
            .string()
            .trim()
            .min(2, "Supervisor name must be at least 2 characters"),

        email: z
            .string()
            .email("Invalid email address")
            .toLowerCase(),

    }),

    z.object({
        role: z.literal("worker"),
        worker_id: objectId,
        email: z
            .string()
            .email("Invalid email address")
            .toLowerCase(),
    })
])


export const getRegistrationTokenInfoSchema = z.object({
    token: z.string().min(1, "Registration token is required")
})