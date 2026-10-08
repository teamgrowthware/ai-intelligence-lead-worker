import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/auth";
import { ReplyIntelligenceService } from "@/services/ReplyIntelligenceService";
import { JobService } from "@/services/JobService";
import { ProviderFactory } from "@/providers/ProviderFactory";
import { env } from "@/config/env";

export async function GET(req: NextRequest) {
  // Webhook verification challenge
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === env.META_WA_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256") || "";
    
    const whatsappProvider = ProviderFactory.getWhatsAppProvider();
    
    // Validate webhook signature
    // The Meta signature expects the raw payload string
    if (!whatsappProvider.verifyWebhook(rawBody as unknown as Record<string, unknown>, signature)) {
      console.warn("[Meta Webhook] Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid object" }, { status: 400 });
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.value && change.value.messages) {
          for (const message of change.value.messages) {
            const from = message.from; // Phone number without +
            const bodyContent = message.text?.body;
            const messageSid = message.id; // wamid.HBg...

            if (!from || !bodyContent) continue;

            // 1. Find Conversation by Lead phone
            let conversation = await prisma.conversation.findFirst({
              where: { lead: { phone: { contains: from } }, channel: "WHATSAPP" },
              include: { lead: true }
            });

            if (!conversation) {
              conversation = await prisma.conversation.findFirst({
                where: { lead: { whatsapp: { contains: from } }, channel: "WHATSAPP" },
                include: { lead: true }
              });
            }

            if (!conversation) {
              console.warn("[Meta Webhook] Received message from unknown lead:", from);
              continue;
            }

            const workspaceId = conversation.lead.workspaceId;

            // Idempotency check
            const existingMsg = await prisma.message.findUnique({ where: { externalMessageId: messageSid } });
            if (existingMsg) {
              continue; // Skip processing already processed message
            }

            const msg = await prisma.message.create({
              data: {
                conversationId: conversation.id,
                direction: "INBOUND",
                content: bodyContent,
                status: "DELIVERED",
                externalMessageId: messageSid
              }
            });

            await prisma.messageEvent.create({
              data: {
                messageId: msg.id,
                status: "DELIVERED",
                providerEventId: messageSid
              }
            });

            await ReplyIntelligenceService.analyzeIncomingMessage(workspaceId, msg.id);

            await JobService.enqueue("NOTIFICATION", {
              workspaceId,
              type: "MESSAGE_RECEIVED",
              message: `New WhatsApp message received.`
            });

            await JobService.enqueue("LEAD_SCORING", {
              workspaceId,
              leadId: conversation.lead.id
            });

            await prisma.activity.create({
              data: {
                workspaceId,
                leadId: conversation.lead.id,
                type: "INBOUND_MESSAGE_RECEIVED",
                description: `Received a WhatsApp message via Meta`
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Meta Webhook Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
