import { prisma } from "@/auth";

export class PromptService {
  /**
   * Retrieves the active prompt version for a given key.
   * If it doesn't exist, it seeds a default one for this environment.
   */
  static async getActivePrompt(name: string, defaultContent: string): Promise<{ id: string; content: string }> {
    let prompt = await prisma.promptVersion.findFirst({
      where: { name, isActive: true },
      orderBy: { createdAt: "desc" }
    });

    if (!prompt) {
      prompt = await prisma.promptVersion.create({
        data: {
          name,
          content: defaultContent,
          version: "1.0.0",
          isActive: true
        }
      });
    }

    return { id: prompt.id, content: prompt.content };
  }
}
