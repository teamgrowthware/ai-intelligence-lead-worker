export interface IAIProvider {
  generateStructured<T>(prompt: string, schema?: unknown): Promise<{ data: T; tokens: { input: number; output: number }; durationMs: number; cost?: number }>;
}

export interface IWhatsAppProvider {
  sendMessage(to: string, content: string): Promise<any>;
  sendTemplateMessage?(params: { to: string; templateName: string; languageCode: string; components?: any[] }): Promise<any>;
  verifyWebhook(payload: Record<string, unknown>, signature: string, url?: string): boolean;
  validateConfiguration?(): void;
}

export interface IEmailProvider {
  sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean>;
}

export interface IScrapingProvider {
  scrapeWebsite(url: string): Promise<string>;
}

export interface IEnrichmentProvider {
  enrichCompany(domain: string): Promise<Record<string, unknown>>;
  enrichContact(email: string): Promise<Record<string, unknown>>;
}

export interface IStorageProvider {
  uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
  getPresignedUrl(key: string): Promise<string>;
}
