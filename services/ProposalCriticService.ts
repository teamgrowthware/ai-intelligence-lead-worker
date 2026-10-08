import { prisma } from "@/auth";
import { AiRunService } from "./AiRunService";
import { PromptService } from "./PromptService";
import { IdempotencyService } from "./IdempotencyService";
import { z } from "zod";

const DEFAULT_CRITIC_PROMPT = `
You are an expert Proposal Critic.
Evaluate the provided Generated Proposal against the original Lead Requirement, Strategy, and Portfolio.

Instructions:
1. Detect any invented facts (hallucinations), fake metrics, fake client names, or unsupported claims.
2. Evaluate personalization, relevance, clarity, and credibility.
3. Check positioning mode alignment.
4. Output your evaluation in strict JSON.

[TASK: PROPOSAL_CRITIC]
`;

export const CriticOutputSchema = z.object({
  overall_score: z.number().min(0).max(100),
  personalization_score: z.number().min(0).max(100),
  relevance_score: z.number().min(0).max(100),
  clarity_score: z.number().min(0).max(100),
  credibility_score: z.number().min(0).max(100),
  cta_score: z.number().min(0).max(100),
  positioning_score: z.number().min(0).max(100),
  hallucination_risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  missing_points: z.array(z.string()),
  weak_points: z.array(z.string()),
  improvement_suggestions: z.array(z.string()),
  final_decision: z.enum(["PASS", "NEEDS_IMPROVEMENT", "HIGH_RISK"])
});

export type CriticOutput = z.infer<typeof CriticOutputSchema>;

export class ProposalCriticService {
  static async runCritic(workspaceId: string, proposalId: string) {
    const idempotencyKey = `critic_${proposalId}`;
    const reserved = await IdempotencyService.reserve(idempotencyKey, "run_critic", 300);
    if (!reserved) {
      throw new Error("Critic evaluation already in progress for this proposal.");
    }

    try {
      const proposal = await prisma.generatedProposal.findUnique({
        where: { id: proposalId, workspaceId },
        include: { lead: true, strategy: true }
      });
      if (!proposal) throw new Error("Proposal not found");

      const prompt = await PromptService.getActivePrompt("PROPOSAL_CRITIC_V1", DEFAULT_CRITIC_PROMPT);
      
      const contextStr = JSON.stringify({
        lead: proposal.lead,
        strategy: proposal.strategy,
        proposalContent: proposal.content
      }, null, 2);

      const promptContent = `${prompt.content}\n\nCONTEXT:\n${contextStr}`;

      const { data } = await AiRunService.executeStructuredRun<CriticOutput>(
        workspaceId, 
        prompt.id, 
        promptContent
      );

      const validatedData = CriticOutputSchema.parse(data);

      await prisma.generatedProposal.update({
        where: { id: proposalId },
        data: {
          criticScore: validatedData.overall_score,
          criticFeedback: JSON.stringify(validatedData)
        }
      });

      await prisma.activity.create({
        data: {
          workspaceId,
          leadId: proposal.leadId,
          type: "PROPOSAL_CRITIC_RUN",
          description: `Critic ran on proposal v${proposal.versionNumber}. Score: ${validatedData.overall_score}. Decision: ${validatedData.final_decision}.`
        }
      });

      await IdempotencyService.release(idempotencyKey);
      return validatedData;
    } catch (e) {
      await IdempotencyService.release(idempotencyKey);
      throw e;
    }
  }
}
