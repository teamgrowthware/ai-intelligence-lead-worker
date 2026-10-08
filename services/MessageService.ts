import { prisma } from "@/auth";
import { MessageChannel, MessageDirection } from "@prisma/client";
import { ProviderFactory } from "@/providers/ProviderFactory";

export class MessageService {
  static async getConversations(workspaceId: string, search?: string, channel?: string) {
    return prisma.conversation.findMany({
      where: { 
        lead: { workspaceId, ...(search ? {} : {}) },
        ...(channel ? { channel: channel as MessageChannel } : {})
      },
      include: { lead: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { updatedAt: 'desc' }
    });
  }

  static async getConversation(workspaceId: string, conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId, lead: { workspaceId } },
      include: { lead: true, messages: { orderBy: { createdAt: 'asc' } } }
    });
  }

  static async createDraft(workspaceId: string, leadId: string, channel: MessageChannel, content: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.workspaceId !== workspaceId) throw new Error("Lead does not belong to this workspace");

    let conv = await prisma.conversation.findFirst({ where: { leadId, channel } });
    if (!conv) conv = await prisma.conversation.create({ data: { leadId, channel } });
    return prisma.message.create({
      data: { conversationId: conv.id, direction: "OUTBOUND", content, status: "DRAFT" }
    });
  }

  static async sendMessage(workspaceId: string, messageId: string) {
    const msg = await prisma.message.findUnique({ where: { id: messageId }, include: { conversation: { include: { lead: true } } } });
    if (!msg || msg.conversation.lead.workspaceId !== workspaceId) throw new Error("Unauthorized");
    
    await prisma.message.update({ where: { id: messageId }, data: { status: "SENDING" } });
    
    try {
      if (msg.conversation.channel === "WHATSAPP") {
        const whatsapp = ProviderFactory.getWhatsAppProvider();
        const providerId = await whatsapp.sendMessage(msg.conversation.lead.phone || "unknown", msg.content);
        await prisma.messageEvent.create({ data: { messageId, status: "SENT", providerEventId: providerId } });
        return prisma.message.update({ where: { id: messageId }, data: { status: "SENT", externalMessageId: providerId } });
      } else if (msg.conversation.channel === "EMAIL") {
        const email = ProviderFactory.getEmailProvider();
        await email.sendEmail(msg.conversation.lead.email || "unknown", "Outreach", msg.content);
        await prisma.messageEvent.create({ data: { messageId, status: "SENT" } });
        return prisma.message.update({ where: { id: messageId }, data: { status: "SENT" } });
      }
    } catch (e) {
      await prisma.messageEvent.create({ data: { messageId, status: "FAILED" } });
      return prisma.message.update({ where: { id: messageId }, data: { status: "FAILED" } });
    }
  }

  static async retryMessage(workspaceId: string, messageId: string) {
    const msg = await prisma.message.findUnique({ where: { id: messageId }, include: { conversation: { include: { lead: true } } } });
    if (!msg || msg.conversation.lead.workspaceId !== workspaceId) throw new Error("Unauthorized");
    if (msg.status !== "FAILED") throw new Error("Only failed messages can be retried");
    return this.sendMessage(workspaceId, messageId);
  }
}
