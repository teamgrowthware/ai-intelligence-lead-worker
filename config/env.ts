import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  
  // Provider Selection
  AI_PROVIDER: z.string().default("mock"),
  WHATSAPP_PROVIDER: z.string().default("mock"),
  EMAIL_PROVIDER: z.string().default("mock"),
  DISCOVERY_PROVIDER: z.string().default("mock"),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o"),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openrouter/free"),

  // Meta WhatsApp Cloud API
  META_WA_ACCESS_TOKEN: z.string().optional(),
  META_WA_PHONE_NUMBER_ID: z.string().optional(),
  META_WA_BUSINESS_ACCOUNT_ID: z.string().optional(),
  META_WA_VERIFY_TOKEN: z.string().optional(),
  META_WA_APP_SECRET: z.string().optional(),
  META_GRAPH_API_VERSION: z.string().default("v19.0"),
  META_WA_TEST_RECIPIENT: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
