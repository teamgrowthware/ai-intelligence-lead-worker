import { IAIProvider, IWhatsAppProvider, IEmailProvider, IScrapingProvider } from "./interfaces";
import { OpenAIProvider } from "./OpenAIProvider";
import { OpenRouterProvider } from "./OpenRouterProvider";
import { MetaCloudWhatsAppProvider } from "./MetaCloudWhatsAppProvider";
import { ResendProvider } from "./ResendProvider";
import { env } from "@/config/env";

// Mock Providers (Assuming they exist or can be inline-stubbed if needed, though they exist in original architecture)
export class MockAIProvider implements IAIProvider {
  async generateStructured<T>(prompt: string, schema?: unknown): Promise<{ data: T; tokens: { input: number; output: number }; durationMs: number; cost?: number }> {
    return {
      data: {} as T,
      tokens: { input: 10, output: 10 },
      durationMs: 100,
      cost: 0
    };
  }
}
export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(to: string, content: string) { return "mock_message_id"; }
  verifyWebhook(payload: Record<string, unknown>, signature: string, url?: string) { return true; }
}
export class MockEmailProvider implements IEmailProvider {
  async sendEmail(to: string, subject: string, body: string) { return true; }
}
export class MockScrapingProvider implements IScrapingProvider {
  async scrapeWebsite(url: string) { return "Mock Scraped Content"; }
}

export class ProviderFactory {
  static getAIProvider(): IAIProvider {
    if (env.AI_PROVIDER === "openai") return new OpenAIProvider();
    if (env.AI_PROVIDER === "openrouter") return new OpenRouterProvider();
    return new MockAIProvider();
  }

  static getWhatsAppProvider(): IWhatsAppProvider {
    if (env.WHATSAPP_PROVIDER === "twilio") {
      throw new Error("Twilio WhatsApp is no longer supported. Please configure WHATSAPP_PROVIDER='meta'.");
    }
    if (env.WHATSAPP_PROVIDER === "meta") return new MetaCloudWhatsAppProvider();
    return new MockWhatsAppProvider();
  }

  static getEmailProvider(): IEmailProvider {
    if (env.EMAIL_PROVIDER === "resend") return new ResendProvider();
    return new MockEmailProvider();
  }

  static getScrapingProvider(): IScrapingProvider {
    // To be implemented: real scraping provider
    return new MockScrapingProvider();
  }
}
