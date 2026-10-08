import { env } from "../config/env";
import { ProviderFactory } from "../providers/ProviderFactory";

async function main() {
  console.log("Starting Meta WhatsApp API tests...");

  // 1. Check env vars
  if (!env.META_WA_ACCESS_TOKEN || !env.META_WA_PHONE_NUMBER_ID || !env.META_WA_BUSINESS_ACCOUNT_ID) {
    console.error("Test Error: META_WA_ACCESS_TOKEN, META_WA_PHONE_NUMBER_ID, or META_WA_BUSINESS_ACCOUNT_ID is not configured.");
    console.log(`
REAL META API TEST: NOT RUN
`);
    process.exit(0);
  }

  try {
    const whatsapp = ProviderFactory.getWhatsAppProvider();
    
    // Check if a test recipient is provided
    const testRecipient = env.META_WA_TEST_RECIPIENT;
    if (!testRecipient) {
        console.warn("No META_WA_TEST_RECIPIENT provided in environment. Skipping actual message send test.");
        console.log("REAL META API TEST: NOT RUN");
        process.exit(0);
    }

    console.log(`Attempting to send regular message to: ${testRecipient}`);
    const messageId = await whatsapp.sendMessage(testRecipient, "Hello! This is a test message from AI Lead Intelligence via Meta Cloud API.");
    console.log(`Successfully sent regular message. Provider Message ID: ${messageId}`);

    console.log(`Attempting to send template message to: ${testRecipient}`);
    if (whatsapp.sendTemplateMessage) {
      const templateMessageId = await whatsapp.sendTemplateMessage({
        to: testRecipient,
        templateName: "hello_world",
        languageCode: "en_US"
      });
      console.log(`Successfully sent template message. Provider Message ID: ${templateMessageId}`);
    } else {
      console.warn("sendTemplateMessage not implemented on provider.");
    }

    console.log(`
REAL META API TEST: PASS
`);
  } catch (error: any) {
    console.error("REAL META API TEST: FAIL");
    console.error(error.message);
    process.exit(1);
  }
}

main().catch(console.error);
