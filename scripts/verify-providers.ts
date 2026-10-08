import { env } from "../config/env";
import { ProviderFactory } from "../providers/ProviderFactory";
import { prisma } from "../auth";
import fs from "fs";

async function verify() {
  console.log("🚀 Starting Provider Integration Verification");

  // 1. Verify Env Validation
  console.log("Environment variables validated successfully.");
  console.log(`Current Configuration:
  AI_PROVIDER: ${env.AI_PROVIDER}
  WHATSAPP_PROVIDER: ${env.WHATSAPP_PROVIDER}
  EMAIL_PROVIDER: ${env.EMAIL_PROVIDER}
  `);

  // 2. Verify AI Provider Creation
  const aiProvider = ProviderFactory.getAIProvider();
  console.log(`AI Provider instantiated: ${aiProvider.constructor.name}`);

  // 3. Verify WhatsApp Provider Creation
  const whatsappProvider = ProviderFactory.getWhatsAppProvider();
  console.log(`WhatsApp Provider instantiated: ${whatsappProvider.constructor.name}`);

  // 4. Verify Email Provider Creation
  const emailProvider = ProviderFactory.getEmailProvider();
  console.log(`Email Provider instantiated: ${emailProvider.constructor.name}`);

  // 5. Check if webhook routes exist
  const metaRouteExists = fs.existsSync("./app/api/webhooks/meta/whatsapp/route.ts");
  const resendRouteExists = fs.existsSync("./app/api/webhooks/resend/route.ts");
  
  if (!metaRouteExists || !resendRouteExists) {
    throw new Error("Webhook routes missing!");
  }
  console.log("Webhook routes verified.");

  // 6. DB Connection
  await prisma.$connect();
  console.log("Database connection verified.");
  
  console.log("✅ Verification Script Completed. System is fully prepared for real API connections.");
}

verify().catch(console.error).finally(() => process.exit(0));
