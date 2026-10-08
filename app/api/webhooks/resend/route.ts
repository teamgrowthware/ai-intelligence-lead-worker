import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Resend webhook signature validation goes here
    // ...

    const { type, data } = body;
    // data usually contains { email_id: '...', ... }

    if (type === "email.delivered" || type === "email.bounced" || type === "email.complained") {
      const externalMessageId = data.email_id;
      if (externalMessageId) {
        const msg = await prisma.message.findFirst({ where: { externalMessageId } });
        if (msg) {
          const status = type === "email.delivered" ? "DELIVERED" : "FAILED";
          await prisma.messageEvent.create({
            data: {
              messageId: msg.id,
              status,
              providerEventId: data.email_id
            }
          });
          await prisma.message.update({
            where: { id: msg.id },
            data: { status }
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Resend Webhook Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
