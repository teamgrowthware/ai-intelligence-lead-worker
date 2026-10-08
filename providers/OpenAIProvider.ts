import { IAIProvider } from "./interfaces";
import OpenAI from "openai";
import { env } from "@/config/env";

export class OpenAIProvider implements IAIProvider {
  private openai: OpenAI | null = null;
  private model: string;

  constructor() {
    this.model = env.OPENAI_MODEL;
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  async generateStructured<T>(prompt: string, schema?: unknown): Promise<{ data: T; tokens: { input: number; output: number }; durationMs: number; cost?: number }> {
    if (!this.openai) {
      throw new Error("OpenAI is not configured (missing OPENAI_API_KEY)");
    }

    const start = Date.now();
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
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
      console.error("[OpenAI Provider] generateStructured error:", error.message);
      throw error;
    }
  }
}
