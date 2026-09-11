import { z } from "zod";

const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters");

export const registerSchema = z.union([
    
    z.object({
        role: z.literal("admin"),

        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email format"),
        phone: z.string().optional(),
        password: passwordSchema,
        confirmPassword: passwordSchema,

        farm_name: z.string().min(1, "Farm name is required"),

        token: z.undefined().optional(),
    }).refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        }
    ),

    z.object({
        token: z
            .string()
            .min(1, "Registration token is required"),

        password: passwordSchema,

        confirmPassword: passwordSchema,
    }).refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        }
    ),
]);

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});