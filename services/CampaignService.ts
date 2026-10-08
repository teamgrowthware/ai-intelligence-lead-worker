import { prisma } from "@/auth";

export class CampaignService {
  static async startCampaign(workspaceId: string, campaignId: string) {
    const { CampaignExecutionService } = await import("./CampaignExecutionService");
    return CampaignExecutionService.queueRecipients(workspaceId, campaignId);
  }

  static async getCampaignStats(workspaceId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId, workspaceId },
      include: { recipients: true }
    });
    if (!campaign) throw new Error("Campaign not found");

    const total = campaign.recipients.length;
    const sent = campaign.recipients.filter(r => r.status === "SENT").length;
    const failed = campaign.recipients.filter(r => r.status === "FAILED").length;
    
    return { total, sent, failed, status: campaign.status };
  }
}
