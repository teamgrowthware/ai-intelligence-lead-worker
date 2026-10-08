import { IAIProvider } from "./interfaces";
import OpenAI from "openai";
import { env } from "@/config/env";

export class OpenRouterProvider implements IAIProvider {
  private openai: OpenAI | null = null;
  private model: string;

  constructor() {
    this.model = env.OPENROUTER_MODEL;
    if (env.OPENROUTER_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
          "X-Title": "AI Lead Intelligence"
        }
      });
    }
  }

  async generateStructured<T>(prompt: string, schema?: unknown): Promise<{ data: T; tokens: { input: number; output: number }; durationMs: number; cost?: number }> {
    if (!this.openai) {
      throw new Error("OpenRouter is not configured (missing OPENROUTER_API_KEY)");
    }

    const start = Date.now();
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          ...(schema ? [{ role: "system" as const, content: `Please return JSON output matching this schema: ${JSON.stringify(schema)}` }] : []),
          { role: "user" as const, content: prompt }
        ],
        response_format: schema ? { type: "json_object" } : undefined
      });
      
      const content = response.choices[0].message.content || "{}";
      const input = response.usage?.prompt_tokens || 0;
      const output = response.usage?.completion_tokens || 0;
      
      return {
        data: JSON.parse(content) as T,
        tokens: { input, output },
        durationMs: Date.now() - start
      };
    } catch (error: any) {
      console.error("[OpenRouter Provider] generateStructured error:", error.message);
      throw error;
    }
  }
}
