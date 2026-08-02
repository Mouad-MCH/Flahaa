import dotenv from 'dotenv'
import { z } from 'zod';

process.env.APP_STAGE = process.env.APP_STAGE ?? 'dev';

const isDev = process.env.APP_STAGE === 'dev';
const isTest = process.env.APP_STAGE === 'test';

if (isDev) {
  dotenv.config()
} else if (isTest) {
  dotenv.config({ path: '.env.test' });    
}

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
    
    APP_STAGE: z
        .enum(['dev', 'production', 'test'])
        .default('dev'),

    PORT: z.coerce.number().int().positive().default(3030),

    MONGODB_URI: z.string().refine(
        (val) => val.startsWith("mongodb+srv://") || val.startsWith("mongodb://"), 
        {
            message: 'URL must start with mongodb:// or mongodb+srv://',
            path: ['MONGODB_URI']
        }
    ),

    BCRYPT_SALT_ROUNDS: z.coerce.number().positive().default(10),

    JWT_SECRET: z.string().min(30),
    JWT_REFRESH_SECRET: z.string().min(30),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().positive().default(5),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
})

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("Invalid environment variables:", env.error.format());
  process.exit(1);
}

export const ENV = env.data;
