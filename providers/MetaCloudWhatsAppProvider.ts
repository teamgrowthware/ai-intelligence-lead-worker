import { IWhatsAppProvider } from "./interfaces";
import { env } from "@/config/env";
import crypto from "crypto";

export class MetaCloudWhatsAppProvider implements IWhatsAppProvider {
  validateConfiguration(): void {
    if (!env.META_WA_ACCESS_TOKEN || !env.META_WA_PHONE_NUMBER_ID) {
      throw new Error("Meta WhatsApp Cloud API is not fully configured (missing token or phone number ID).");
    }
  }

  async sendMessage(to: string, content: string): Promise<any> {
    this.validateConfiguration();

    // Ensure format removes '+' if present, Meta wants international format without '+'
    const toFormatted = to.replace("+", "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toFormatted,
      type: "text",
      text: {
        preview_url: false,
        body: content
      }
    };

    return this.sendToMeta(payload);
  }

  async sendTemplateMessage(params: { to: string; templateName: string; languageCode: string; components?: any[] }): Promise<any> {
    this.validateConfiguration();
    
    const toFormatted = params.to.replace("+", "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toFormatted,
      type: "template",
      template: {
        name: params.templateName,
        language: {
          code: params.languageCode
        },
        components: params.components || []
      }
    };

    return this.sendToMeta(payload);
  }

  private async sendToMeta(payload: any): Promise<any> {
    const url = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${env.META_WA_PHONE_NUMBER_ID}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.META_WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Meta Provider] sendMessage error:", data);
      throw new Error(data.error?.message || "Failed to send message via Meta Cloud API");
    }

    if (data.messages && data.messages.length > 0) {
      const messageId = data.messages[0].id;
      console.log(`[Meta Provider] Message sent, ID: ${messageId}`);
      return messageId;
    }

    throw new Error("Meta Cloud API accepted request but returned no message ID.");
  }

  verifyWebhook(payload: Record<string, unknown>, signature: string, url?: string): boolean {
    if (!env.META_WA_APP_SECRET) return false;

    // Payload should be the raw body string for accurate HMAC calculation, 
    // but the interface takes Record. Let's assume the caller passes the raw body as a string cast to unknown, 
    // or we recalculate. Wait, the interface is Record<string, unknown>. 
    // In Express/Next.js, we should validate the raw body. 
    // If payload is passed as raw text (string) we can validate it.
    const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
    
    const expectedSignature = crypto
      .createHmac("sha256", env.META_WA_APP_SECRET)
      .update(rawBody)
      .digest("hex");
    
    // The signature comes as "sha256=..."
    const expected = `sha256=${expectedSignature}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
