export class MockWhatsAppProvider {
  static async sendMessage(to: string, message: string) {
    console.log(`[WhatsApp Mock] Sending to ${to}: ${message}`);
    return "mock_message_id";
  }
}
