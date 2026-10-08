import { prisma } from "@/auth";
import { AiRunService } from "./AiRunService";
import { PromptService } from "./PromptService";
import { IdempotencyService } from "./IdempotencyService";

const DEFAULT_PROPOSAL_STRATEGY_PROMPT = `
You are an expert proposal strategist and sales director.
Review the Lead Intelligence profile and determine the best approach for winning this deal.
Focus on positioning, tone, pricing strategy, urgency strategy, and matching credibility points.
[TASK: PROPOSAL_STRATEGY]
`;

interface StrategyData {
  positioningMode?: string;
  recommendedTone?: string;
  openingAngle?: string;
  recommendedValueProposition?: string;
  recommendedServices?: string[];
  recommendedProofPoints?: string[];
  recommendedCallToAction?: string;
  pricingStrategy?: string;
  urgencyStrategy?: string;
  objectionStrategy?: string;
  personalizationPoints?: string[];
  thingsToAvoid?: string[];
}

export class ProposalStrategyService {
  static async generateStrategy(workspaceId: string, leadId: string): Promise<Record<string, unknown>> {
    const idempotencyKey = `strategy_${leadId}`;
    const reserved = await IdempotencyService.reserve(idempotencyKey, "generate_strategy", 300);
    if (!reserved) {
      throw new Error("Strategy generation already in progress for this lead.");
    }

    try {
      const intel = await prisma.leadIntelligence.findUnique({
        where: { leadId },
        include: { lead: true }
      });

      if (!intel) throw new Error("Lead Intelligence required before Strategy generation.");

      const prompt = await PromptService.getActivePrompt("PROPOSAL_STRATEGY_V1", DEFAULT_PROPOSAL_STRATEGY_PROMPT);
      const promptContent = `${prompt.content}\n\nINTELLIGENCE DATA:\n${JSON.stringify(intel, null, 2)}`;

      const { data } = await AiRunService.executeStructuredRun<StrategyData>(workspaceId, prompt.id, promptContent);

      // Create new strategy to maintain versioning history instead of upserting if we want history,
      // But for simplicity, we'll store the latest active one. The schema allows multiple strategies per lead.
      const strategy = await prisma.proposalStrategy.create({
        data: {
          leadId,
          positioningMode: data.positioningMode,
          tone: data.recommendedTone,
          proposalAngle: data.openingAngle,
          recommendedValueProposition: data.recommendedValueProposition,
          recommendedService: data.recommendedServices?.join(", ") || null,
          credibilityPoints: data.recommendedProofPoints || [],
          cta: data.recommendedCallToAction,
          pricingStrategy: data.pricingStrategy,
          urgencyStrategy: data.urgencyStrategy,
          objectionStrategy: data.objectionStrategy,
          personalizationPoints: data.personalizationPoints || [],
          thingsToAvoid: data.thingsToAvoid || [],
        }
      });

      await prisma.activity.create({
        data: {
          workspaceId,
          leadId,
          type: "PROPOSAL_STRATEGY_GENERATED",
          description: "Generated AI proposal strategy.",
        }
      });

      await IdempotencyService.recordResult(idempotencyKey, 200, { success: true, id: strategy.id });
      return strategy;
    } catch (e: unknown) {
      await IdempotencyService.recordResult(idempotencyKey, 500, { error: (e as Error).message });
      throw e;
    }
  }
}
