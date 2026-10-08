"use server";

import { auth } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { ProposalGenerationService } from "@/services/ProposalGenerationService";
import { ProposalCriticService } from "@/services/ProposalCriticService";
import { ProposalStatus } from "@prisma/client";

export async function generateProposalAction(
  leadId: string, 
  strategyId: string,
  portfolioItemIds: string[],
  positioningMode: "FREELANCER" | "AGENCY" | "HYBRID",
  length: "SHORT" | "MEDIUM" | "DETAILED"
) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const proposal = await ProposalGenerationService.generateProposal(
    workspaceId,
    leadId,
    strategyId,
    portfolioItemIds,
    positioningMode,
    length
  );
  revalidatePath(`/leads/${leadId}/proposal`);
  return proposal;
}

export async function runCriticAction(leadId: string, proposalId: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  await ProposalCriticService.runCritic(workspaceId, proposalId);
  revalidatePath(`/leads/${leadId}/proposal`);
}

export async function saveProposalEditAction(leadId: string, proposalId: string, newContent: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const existing = await prisma.generatedProposal.findUnique({
    where: { id: proposalId, workspaceId }
  });
  if (!existing) throw new Error("Not found");

  await prisma.generatedProposal.update({
    where: { id: proposalId },
    data: {
      content: newContent,
      status: ProposalStatus.CHANGES_REQUESTED
    }
  });

  await prisma.activity.create({
    data: {
      workspaceId,
      leadId,
      type: "PROPOSAL_EDITED",
      description: `Proposal v${existing.versionNumber} manually edited.`
    }
  });

  revalidatePath(`/leads/${leadId}/proposal`);
}

export async function approveProposalAction(leadId: string, proposalId: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const existing = await prisma.generatedProposal.findUnique({
    where: { id: proposalId, workspaceId }
  });
  if (!existing) throw new Error("Not found");

  // Optional: Add checking for HIGH_RISK here if you want to block approval

  await prisma.generatedProposal.update({
    where: { id: proposalId },
    data: {
      status: ProposalStatus.APPROVED,
      approvedAt: new Date(),
      approvedBy: session.user.id
    }
  });

  await prisma.activity.create({
    data: {
      workspaceId,
      leadId,
      type: "PROPOSAL_APPROVED",
      description: `Proposal v${existing.versionNumber} approved.`
    }
  });

  revalidatePath(`/leads/${leadId}/proposal`);
}

export async function rejectProposalAction(leadId: string, proposalId: string, reason: string) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");
  requireRole(session.user as unknown as Parameters<typeof requireRole>[0], 'SALES');
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const existing = await prisma.generatedProposal.findUnique({
    where: { id: proposalId, workspaceId }
  });
  if (!existing) throw new Error("Not found");

  await prisma.generatedProposal.update({
    where: { id: proposalId },
    data: {
      status: ProposalStatus.REJECTED
    }
  });

  await prisma.activity.create({
    data: {
      workspaceId,
      leadId,
      type: "PROPOSAL_REJECTED",
      description: `Proposal v${existing.versionNumber} rejected. Reason: ${reason}`
    }
  });

  revalidatePath(`/leads/${leadId}/proposal`);
}
