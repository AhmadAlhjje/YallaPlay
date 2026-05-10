import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),

  // MongoDB
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_QR_SECRET: z.string().min(32, 'JWT_QR_SECRET must be at least 32 characters'),

  // SMS / WhatsApp
  SMS_PROVIDER: z.enum(['console', 'twilio', 'whatsapp']).default('console'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  WHATSAPP_AUTH_DIR: z.string().optional(),

  // Firebase (FCM push notifications)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),

  // Weather API
  WEATHER_API_KEY: z.string().optional(),
  WEATHER_API_URL: z.string().default('https://api.openweathermap.org/data/2.5'),

  // Frontend URLs (for CORS)
  ADMIN_DASHBOARD_URL: z.string().default('http://localhost:3001'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const missing = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Environment validation failed:\n${missing.join('\n')}`);
  }
  return result.data;
}
