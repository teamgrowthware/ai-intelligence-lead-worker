import { prisma } from "@/auth";
import { MessageService } from "./MessageService";
import { JobService } from "./JobService";

export class CampaignExecutionService {
  static async queueRecipients(workspaceId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId, workspaceId },
      include: { recipients: true }
    });
    if (!campaign) throw new Error("Campaign not found");

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING" }
    });

    for (const recipient of campaign.recipients) {
      if (recipient.status === "PENDING") {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "QUEUED" }
        });
      }
    }

    // Enqueue execution job
    await JobService.enqueue("CAMPAIGN_EXECUTION", { campaignId }, new Date(), `campaign:${campaignId}`);
  }

  static async executeBatch(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });
    if (!campaign || campaign.status !== "RUNNING") return; // Paused or completed

    const BATCH_SIZE = 50;
    const queuedRecipients = await prisma.campaignRecipient.findMany({
      where: { campaignId, status: "QUEUED" },
      take: BATCH_SIZE,
      include: { lead: true }
    });

    if (queuedRecipients.length === 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED" }
      });
      // Notify
      await JobService.enqueue("NOTIFICATION", {
        workspaceId: campaign.workspaceId,
        type: "CAMPAIGN_COMPLETED",
        message: `Campaign ${campaign.name} has completed execution.`
      });
      return;
    }

    for (const recipient of queuedRecipients) {
      const locked = await prisma.campaignRecipient.updateMany({
        where: { id: recipient.id, status: "QUEUED" },
        data: { status: "PROCESSING" }
      });
      
      if (locked.count === 0) {
        continue;
      }

      try {
        const draft = await MessageService.createDraft(
          campaign.workspaceId,
          recipient.leadId,
          "EMAIL", // Hardcoding email channel for campaign for now
          `Hello, this is a message from campaign ${campaign.name}!`
        );
        await MessageService.sendMessage(campaign.workspaceId, draft.id);

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "SENT" }
        });

        // Trigger scoring
        await JobService.enqueue("LEAD_SCORING", {
          workspaceId: campaign.workspaceId,
          leadId: recipient.leadId
        });
      } catch (e: any) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "FAILED" }
        });
      }
    }

    // Re-enqueue for the next batch
    await JobService.enqueue("CAMPAIGN_EXECUTION", { campaignId }, new Date(), `campaign:${campaignId}:${Date.now()}`);
  }
}
