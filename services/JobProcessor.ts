import { FollowupTaskService } from "./FollowupTaskService";
import { ReplyIntelligenceService } from "./ReplyIntelligenceService";

export class JobProcessor {
  static async process(type: string, payload: any) {
    switch (type) {
      case "FOLLOWUP_EXECUTION":
        await FollowupTaskService.executeTask(payload.taskId);
        break;
      case "LEAD_SCORING":
        const { LeadScoringService } = await import("./LeadScoringService");
        await LeadScoringService.calculateScore(payload.workspaceId, payload.leadId);
        break;
      case "CAMPAIGN_EXECUTION":
        const { CampaignExecutionService } = await import("./CampaignExecutionService");
        await CampaignExecutionService.executeBatch(payload.campaignId);
        break;
      case "REPLY_INTELLIGENCE":
        await ReplyIntelligenceService.analyzeReply(payload.messageId);
        break;
      case "NOTIFICATION":
        const { NotificationService } = await import("./NotificationService");
        await NotificationService.createNotification(payload.workspaceId, payload.type, payload.message);
        break;
      case "ANALYTICS_REFRESH":
        // Analytics can be real-time or cached, currently no-op
        break;
      case "GENERIC":
        console.log("Generic job executed", payload);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }
}
