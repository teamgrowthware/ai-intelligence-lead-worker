import { prisma } from "@/auth";
import { AiRunService } from "./AiRunService";
import { PromptService } from "./PromptService";
import { IdempotencyService } from "./IdempotencyService";

const DEFAULT_LEAD_INTELLIGENCE_PROMPT = `
You are an expert technical pre-sales and lead intelligence analyst.
Analyze the provided lead information (contact details, company context, raw requirements).
Extract and infer the structured data points required.
Distinguish clearly between facts provided by the lead, inferred data, and unknown fields.
Do not hallucinate facts. If something is unknown, return null.
[TASK: LEAD_INTELLIGENCE]
`;

interface IntelData {
  requirementSummary?: string;
  detectedServices?: string[];
  buyingIntent?: string;
  leadQuality?: string;
  estimatedBudgetBand?: string;
  estimatedTimeline?: string;
  painPoints?: string[];
  businessGoals?: string[];
  summary?: string;
}

export class LeadIntelligenceService {
  static async generateIntelligence(workspaceId: string, leadId: string): Promise<Record<string, unknown>> {
    const idempotencyKey = `intel_${leadId}`;
    const reserved = await IdempotencyService.reserve(idempotencyKey, "generate_intelligence", 300);
    if (!reserved) {
      throw new Error("Intelligence generation already in progress for this lead.");
    }

    try {
      // 1. Fetch full context
      const lead = await prisma.lead.findUnique({
        where: { id: leadId, workspaceId },
        include: { company: true, contact: true }
      });

      if (!lead) throw new Error("Lead not found");

      // 2. Fetch prompt
      const prompt = await PromptService.getActivePrompt("LEAD_INTELLIGENCE_V1", DEFAULT_LEAD_INTELLIGENCE_PROMPT);

      // 3. Construct prompt payload (in reality, we'd pass JSON representing the lead)
      const promptContent = `${prompt.content}\n\nLEAD DATA:\n${JSON.stringify(lead, null, 2)}`;

      // 4. Execute AI Run
      const { data, runId } = await AiRunService.executeStructuredRun<IntelData>(workspaceId, prompt.id, promptContent);

      // 5. Persist Intelligence
      const intelligence = await prisma.leadIntelligence.upsert({
        where: { leadId },
        create: {
          leadId,
          rawInput: lead.originalRequirement,
          normalizedRequirement: data.requirementSummary,
          detectedServices: data.detectedServices || [],
          intentScore: data.buyingIntent === "High" ? 90 : data.buyingIntent === "Medium" ? 50 : 20,
          fitScore: data.leadQuality === "Qualified" ? 85 : 40,
          budgetSignal: data.estimatedBudgetBand,
          timelineSignal: data.estimatedTimeline,
          painPoints: data.painPoints || [],
          buyingSignals: data.businessGoals || [],
          reasoning: data.summary,
          model: "mock-ai-model",
          aiRunId: runId
        },
        update: {
          rawInput: lead.originalRequirement,
          normalizedRequirement: data.requirementSummary,
          detectedServices: data.detectedServices || [],
          intentScore: data.buyingIntent === "High" ? 90 : data.buyingIntent === "Medium" ? 50 : 20,
          fitScore: data.leadQuality === "Qualified" ? 85 : 40,
          budgetSignal: data.estimatedBudgetBand,
          timelineSignal: data.estimatedTimeline,
          painPoints: data.painPoints || [],
          buyingSignals: data.businessGoals || [],
          reasoning: data.summary,
          model: "mock-ai-model",
          aiRunId: runId,
          updatedAt: new Date()
        }
      });

      // 6. Record Activity
      await prisma.activity.create({
        data: {
          workspaceId,
          leadId,
          type: "AI_INTELLIGENCE_GENERATED",
          description: "Generated lead intelligence profile.",
        }
      });

      await IdempotencyService.recordResult(idempotencyKey, 200, { success: true, id: intelligence.id });
      return intelligence;
    } catch (e: unknown) {
      await IdempotencyService.recordResult(idempotencyKey, 500, { error: (e as Error).message });
      throw e;
    }
  }
}
