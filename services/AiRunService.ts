import { prisma } from "@/auth";
import { ProviderFactory } from "@/providers/ProviderFactory";
import { IAIProvider } from "@/providers/interfaces";
    


export class AiRunService {
  /**
   * Generates structured data using the configured AI provider, automatically tracks the run,
   * logs the prompt version, and calculates duration/costs.
   */
  static async executeStructuredRun<T>(
    workspaceId: string,
    promptVersionId: string,
    promptContent: string,
    schema?: unknown
  ): Promise<{ data: T; runId: string }> {
    const startTime = Date.now();
    let result;
    let error: unknown = null;

    try {
      const provider = ProviderFactory.getAIProvider();
      result = await provider.generateStructured<T>(promptContent, schema);
    } catch (e) {
      error = e;
      throw e;
    } finally {
      const durationMs = Date.now() - startTime;
      
      const aiRun = await prisma.aiRun.create({
        data: {
          promptVersionId,
          inputTokens: result?.tokens.input || 0,
          outputTokens: result?.tokens.output || 0,
          cost: result?.cost || 0,
          durationMs,
        }
      });

      // Note: In a production system we might also log the exact input/output payloads to Cloud Storage
      // to avoid bloating the primary database, but we keep the metadata in `AiRun`.
      
      if (!error) {
        return { data: result!.data, runId: aiRun.id };
      }
    }
    
    throw new Error("AI Run failed");
  }
}
