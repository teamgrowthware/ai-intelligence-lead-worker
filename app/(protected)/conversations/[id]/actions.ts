"use server"
import { auth } from "@/auth";
import { MessageService } from "@/services/MessageService";
import { ReplyIntelligenceService } from "@/services/ReplyIntelligenceService";
import { revalidatePath } from "next/cache";

async function getWorkspace() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) throw new Error("Unauthorized");
  return workspaceId;
}

export async function sendDraftAction(conversationId: string, leadId: string, channel: import("@prisma/client").MessageChannel, content: string) {
  const workspaceId = await getWorkspace();
  const draft = await MessageService.createDraft(workspaceId, leadId, channel, content);
  await MessageService.sendMessage(workspaceId, draft.id);
  revalidatePath(`/conversations/${conversationId}`);
}

export async function retryMessageAction(conversationId: string, messageId: string) {
  const workspaceId = await getWorkspace();
  await MessageService.retryMessage(workspaceId, messageId);
  revalidatePath(`/conversations/${conversationId}`);
}

export async function simulateInboundAction(conversationId: string, content: string) {
  const workspaceId = await getWorkspace();
  await ReplyIntelligenceService.simulateInboundMessage(workspaceId, conversationId, content);
  revalidatePath(`/conversations/${conversationId}`);
}
