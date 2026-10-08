import { PrismaClient } from "@prisma/client";
import * as assert from "assert";
import { ReplyIntelligenceService } from "../services/ReplyIntelligenceService";
import { FollowupTaskService } from "../services/FollowupTaskService";
import { LeadScoringService } from "../services/LeadScoringService";

const prisma = new PrismaClient();

async function runTests() {
  try {
    console.log("Running Phase 7, 8, 11 Verification...");
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) throw new Error("No workspace");
    const lead = await prisma.lead.findFirst({ where: { workspaceId: workspace.id } });
    if (!lead) throw new Error("No lead");
    
    // Create a mock conversation for Phase 7
    let conv = await prisma.conversation.findFirst({ where: { leadId: lead.id } });
    if (!conv) {
      conv = await prisma.conversation.create({ data: { leadId: lead.id, channel: "EMAIL" } });
    }

    // Phase 7: Reply Intelligence
    console.log("Testing Phase 7: Simulate Inbound and Analyze...");
    const msg = await ReplyIntelligenceService.simulateInboundMessage(workspace.id, conv.id, "What is the price for this?");
    const intel = await prisma.messageIntelligence.findUnique({ where: { messageId: msg.id } });
    assert.ok(intel, "Intelligence generated");
    assert.strictEqual(intel.intent, "PRICING_INQUIRY", "AI intent parsing succeeded");

    // Phase 8: Followups
    console.log("Testing Phase 8: Followup Service...");
    const rule = await prisma.followupRule.create({
      data: { workspaceId: workspace.id, triggerState: "NO_REPLY", delayHours: 24, actionType: "SEND_EMAIL" }
    });
    const task = await prisma.followupTask.create({
      data: { leadId: lead.id, ruleId: rule.id, dueAt: new Date(), status: "PENDING" }
    });
    
    await FollowupTaskService.completeTask(workspace.id, task.id);
    const completedTask = await prisma.followupTask.findUnique({ where: { id: task.id } });
    assert.strictEqual(completedTask?.status, "EXECUTED", "Followup task completed");

    // Phase 11: Lead Scoring
    console.log("Testing Phase 11: Lead Scoring...");
    const scoredLead = await LeadScoringService.calculateScore(workspace.id, lead.id);
    assert.ok(scoredLead!.leadScore !== null, "Lead score calculated");

    console.log("✅ Phases 7, 8, 11 Verification Passed.");
    process.exit(0);
  } catch(e) {
    console.error("❌ Test Failed:", e);
    process.exit(1);
  }
}
runTests();
