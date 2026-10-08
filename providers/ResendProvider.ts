import { IEmailProvider } from "./interfaces";
import { Resend } from "resend";
import { env } from "@/config/env";

export class ResendProvider implements IEmailProvider {
  private resend: Resend | null = null;
  private fromEmail: string | null = null;

  constructor() {
    if (env.RESEND_API_KEY) {
      this.resend = new Resend(env.RESEND_API_KEY);
      this.fromEmail = env.RESEND_FROM_EMAIL || null;
    }
  }

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
    if (!this.resend || !this.fromEmail) {
      throw new Error("Resend is not configured.");
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: htmlBody
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      console.log(`[Resend Provider] Email sent, ID: ${response.data?.id}`);
      return true;
    } catch (error: any) {
      console.error("[Resend Provider] sendEmail error:", error.message);
      throw error;
    }
  }
}
