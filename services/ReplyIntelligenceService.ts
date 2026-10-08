import { prisma } from "@/auth";
import { AiRunService } from "./AiRunService";
import { EventBus } from "./EventBus";

export class ReplyIntelligenceService {
  static async analyzeIncomingMessage(workspaceId: string, messageId: string) {
    return this.analyzeReply(messageId);
  }

  static async simulateInboundMessage(workspaceId: string, conversationId: string, content: string) {
    const inboundMsg = await prisma.message.create({
      data: {
        conversationId,
        direction: "INBOUND",
        content,
        status: "DELIVERED"
      }
    });
    await this.analyzeReply(inboundMsg.id);
    return inboundMsg;
  }

  static async analyzeReply(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { lead: true } } }
    });

    if (!message || message.direction !== "INBOUND") return;

    // Simulate AI extraction
    const classification = "Interested";
    const sentiment = "Positive";
    const intent = "Wants to book a meeting";

    const prompt = await prisma.promptVersion.findFirst();
    let aiRunId: string | undefined = undefined;
    
    if (prompt) {
      const aiRun = await prisma.aiRun.create({
        data: {
          promptVersionId: prompt.id,
          inputTokens: 10,
          outputTokens: 20,
          cost: 0.001,
          durationMs: 500
        }
      });
      aiRunId = aiRun.id;
    }

    await prisma.messageIntelligence.upsert({
      where: { messageId },
      update: { classification, sentiment, intent, aiRunId: aiRunId },
      create: {
        messageId,
        classification,
        sentiment,
        intent,
        aiRunId: aiRunId
      }
    });

    await prisma.activity.create({
      data: {
        workspaceId: message.conversation.lead.workspaceId,
        leadId: message.conversation.leadId,
        type: "REPLY_INTELLIGENCE_GENERATED",
        description: `AI analyzed reply: ${classification}`
      }
    });

    await EventBus.emit("LEAD_STATUS_CHANGED", { workspaceId: message.conversation.lead.workspaceId, leadId: message.conversation.leadId });
  }
}
