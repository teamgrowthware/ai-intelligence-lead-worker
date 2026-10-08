import { JobService } from "./JobService";

export class EventBus {
  static async emit(eventType: string, payload: any) {
    switch (eventType) {
      case "LEAD_CREATED":
      case "LEAD_STATUS_CHANGED":
        await JobService.enqueue("LEAD_SCORING", { workspaceId: payload.workspaceId, leadId: payload.leadId });
        break;
      case "MESSAGE_RECEIVED":
        await JobService.enqueue("REPLY_INTELLIGENCE", { messageId: payload.messageId });
        await JobService.enqueue("LEAD_SCORING", { workspaceId: payload.workspaceId, leadId: payload.leadId });
        await JobService.enqueue("NOTIFICATION", {
          workspaceId: payload.workspaceId,
          type: "INBOUND_MESSAGE",
          message: `New message received for lead ${payload.leadId}`
        });
        break;
      case "FOLLOWUP_DUE":
        await JobService.enqueue("FOLLOWUP_EXECUTION", { taskId: payload.taskId });
        break;
      case "CAMPAIGN_STARTED":
        await JobService.enqueue("CAMPAIGN_EXECUTION", { campaignId: payload.campaignId });
        break;
      case "JOB_FAILED":
        await JobService.enqueue("NOTIFICATION", {
          workspaceId: payload.workspaceId,
          type: "JOB_FAILED",
          message: `Job failed: ${payload.jobId}`
        });
        break;
      default:
        console.warn(`Unknown event type: ${eventType}`);
    }
  }
}
