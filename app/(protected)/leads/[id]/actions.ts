"use server";

import { auth } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";

export async function addLeadNoteAction(leadId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);
  const note = formData.get("note") as string;
  
  if (!note || note.trim() === "") return;

  await prisma.activity.create({
    data: {
      workspaceId,
      leadId,
      type: "NOTE_ADDED",
      description: note,
    }
  });

  revalidatePath(`/leads/${leadId}`);
}

import { LeadIntelligenceService } from "@/services/LeadIntelligenceService";
import { ProposalStrategyService } from "@/services/ProposalStrategyService";
import { PortfolioMatchingService } from "@/services/PortfolioMatchingService";

export async function generateLeadIntelligenceAction(leadId: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  await LeadIntelligenceService.generateIntelligence(workspaceId, leadId);
  revalidatePath(`/leads/${leadId}`);
}

export async function generateProposalStrategyAction(leadId: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  await ProposalStrategyService.generateStrategy(workspaceId, leadId);
  revalidatePath(`/leads/${leadId}`);
}

export async function generatePortfolioMatchesAction(leadId: string, strategyId: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  await PortfolioMatchingService.matchPortfolio(workspaceId, strategyId);
  revalidatePath(`/leads/${leadId}`);
}

