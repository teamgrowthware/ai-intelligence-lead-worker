import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/auth";
import { EventBus } from "@/services/EventBus";
import { MessageService } from "@/services/MessageService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ channel: string }> }) {
  const resolvedParams = await params;
  try {
    const payload = await req.json();
    const { to, from, text, workspaceId, externalMessageId } = payload;

    if (!workspaceId || !from || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find lead by phone or email depending on channel
    let lead = await prisma.lead.findFirst({
      where: { workspaceId, [resolvedParams.channel === 'whatsapp' ? 'whatsapp' : 'email']: from }
    });

    if (!lead) {
      // Create lead if missing
      lead = await prisma.lead.create({
        data: {
          workspaceId,
          [resolvedParams.channel === 'whatsapp' ? 'whatsapp' : 'email']: from,
          status: "NEW",
          source: "Mock Webhook"
        }
      });
      await EventBus.emit("LEAD_CREATED", { workspaceId, leadId: lead.id });
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { leadId: lead.id, channel: resolvedParams.channel === 'whatsapp' ? 'WHATSAPP' : 'EMAIL' }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          channel: resolvedParams.channel === 'whatsapp' ? 'WHATSAPP' : 'EMAIL',
          status: "ACTIVE"
        }
      });
    }

    // Insert message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        content: text,
        externalMessageId: externalMessageId || `mock-${Date.now()}`,
        status: "DELIVERED"
      }
    });

    await prisma.messageEvent.create({
      data: {
        messageId: message.id,
        status: "DELIVERED",
        providerEventId: `event-${Date.now()}`
      }
    });

    await EventBus.emit("MESSAGE_RECEIVED", { workspaceId, leadId: lead.id, messageId: message.id });

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error: any) {
    console.error("Mock webhook error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
