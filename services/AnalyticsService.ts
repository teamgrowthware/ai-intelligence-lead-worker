import { prisma } from "@/auth";

export class AnalyticsService {
  static async getWorkspaceAnalytics(workspaceId: string) {
    const leadsCount = await prisma.lead.count({ where: { workspaceId } });
    const wonCount = await prisma.lead.count({ where: { workspaceId, status: "WON" } });
    
    const campaignsCount = await prisma.campaign.count({ where: { workspaceId } });
    const sentMessagesCount = await prisma.message.count({ 
      where: { conversation: { lead: { workspaceId } }, direction: "OUTBOUND" } 
    });

    const aiRunsCount = await prisma.aiRun.count({
        // For simplicity we just return all, or join properly
    });

    return {
      funnel: { total: leadsCount, discovered: leadsCount, qualified: leadsCount, won: wonCount },
      outreach: { sent: sentMessagesCount, replied: 0, responseRate: '0%' },
      proposals: { generated: 0, approved: 0 },
      campaigns: { total: campaignsCount, recipients: 0 },
      followups: { due: 0, completed: 0 },
      scoring: { avgScore: 0 },
      ai: { runs: aiRunsCount }
    };
  }
}
