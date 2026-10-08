import { prisma } from "@/auth";

export class GlobalSearchService {
  static async search(workspaceId: string, query: string) {
    const leads = await prisma.lead.findMany({
      where: { workspaceId, OR: [{ email: { contains: query, mode: 'insensitive' } }] },
      take: 5
    });

    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId, name: { contains: query, mode: 'insensitive' } },
      take: 5
    });

    const messages = await prisma.message.findMany({
      where: { 
        conversation: { lead: { workspaceId } },
        content: { contains: query, mode: 'insensitive' }
      },
      take: 5
    });

    return { leads, campaigns, messages };
  }
}
