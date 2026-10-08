export class MockEmailProvider {
  static async sendEmail(to: string, subject: string, body: string) {
    console.log(`[Email Mock] Sending to ${to}: ${subject}`);
    return { success: true, messageId: `em_mock_${Date.now()}` };
  }
}
