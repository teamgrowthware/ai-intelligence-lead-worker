import { prisma } from "@/auth";
import { AiRunService } from "./AiRunService";
import { PromptService } from "./PromptService";
import { IdempotencyService } from "./IdempotencyService";
import { z } from "zod";
import { ProposalStatus } from "@prisma/client";

const DEFAULT_GENERATION_PROMPT = `
You are an expert sales proposal generator.
Use the provided Context to draft a highly personalized, compelling proposal.

Context contains:
- Lead Info
- Lead Intelligence
- Proposal Strategy
- Selected Portfolio Items

Instructions:
1. Do not invent any client names, experience, percentages, or portfolio data.
2. Adhere to the positioning mode: FREELANCER (founder-led), AGENCY (team capabilities), or HYBRID.
3. Sound human, confident, and business-focused. No buzzword-salad.
4. Output strict JSON with the required structure.

[TASK: PROPOSAL_GENERATION]
`;

export const GeneratedProposalSchema = z.object({
  title: z.string(),
  opening: z.string(),
  client_understanding: z.string(),
  proposed_solution: z.string(),
  recommended_services: z.array(z.string()),
  approach: z.string(),
  relevant_experience: z.string(),
  proof_points: z.array(z.string()),
  value_proposition: z.string(),
  call_to_action: z.string(),
  closing: z.string(),
  full_text: z.string()
});

export type GeneratedProposalOutput = z.infer<typeof GeneratedProposalSchema>;

export class ProposalGenerationService {
  static async generateProposal(
    workspaceId: string, 
    leadId: string, 
    strategyId: string,
    portfolioItemIds: string[],
    positioningMode: "FREELANCER" | "AGENCY" | "HYBRID",
    length: "SHORT" | "MEDIUM" | "DETAILED" = "MEDIUM"
  ) {
    const idempotencyKey = `proposal_gen_${leadId}_${strategyId}`;
    const reserved = await IdempotencyService.reserve(idempotencyKey, "generate_proposal", 300);
    if (!reserved) {
      throw new Error("Proposal generation already in progress for this lead.");
    }

    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId, workspaceId },
        include: { company: true, contact: true }
      });
      if (!lead) throw new Error("Lead not found");

      const intel = await prisma.leadIntelligence.findUnique({ where: { leadId } });
      if (!intel) throw new Error("Lead Intelligence required");

      const strategy = await prisma.proposalStrategy.findUnique({ where: { id: strategyId, leadId } });
      if (!strategy) throw new Error("Proposal Strategy required");

      const portfolioItems = await prisma.portfolioItem.findMany({
        where: { id: { in: portfolioItemIds }, workspaceId, isActive: true }
      });

      // Prepare context
      const prompt = await PromptService.getActivePrompt("PROPOSAL_GENERATION_V1", DEFAULT_GENERATION_PROMPT);
      
      const contextStr = JSON.stringify({
        lead,
        intelligence: intel,
        strategy,
        portfolio: portfolioItems,
        positioningMode,
        length
      }, null, 2);

      const promptContent = `${prompt.content}\n\nCONTEXT:\n${contextStr}`;

      const { data, runId } = await AiRunService.executeStructuredRun<GeneratedProposalOutput>(
        workspaceId, 
        prompt.id, 
        promptContent
      );

      // Validate structured output
      const validatedData = GeneratedProposalSchema.parse(data);

      // Determine version number
      const existingProposals = await prisma.generatedProposal.findMany({
        where: { leadId },
        orderBy: { versionNumber: 'desc' },
        take: 1
      });
      const nextVersion = existingProposals.length > 0 ? existingProposals[0].versionNumber + 1 : 1;

      // Save proposal
      const proposal = await prisma.generatedProposal.create({
        data: {
          workspaceId,
          leadId,
          strategyId,
          promptVersionId: prompt.id,
          positioningMode,
          versionNumber: nextVersion,
          title: validatedData.title,
          content: validatedData.full_text, // fallback mapping
          fullText: validatedData.full_text,
          structuredContent: JSON.stringify(validatedData),
          status: ProposalStatus.GENERATED,
          aiRunId: runId,
        }
      });

      await prisma.activity.create({
        data: {
          workspaceId,
          leadId,
          type: "PROPOSAL_GENERATED",
          description: `Proposal v${nextVersion} generated automatically.`
        }
      });

      await IdempotencyService.release(idempotencyKey);
      return proposal;
    } catch (e) {
      await IdempotencyService.release(idempotencyKey);
      throw e;
    }
  }
}
