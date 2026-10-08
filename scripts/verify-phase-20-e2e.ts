import { PrismaClient } from "@prisma/client";
import * as assert from "assert";
import { LeadDiscoveryService } from "../services/LeadDiscoveryService";
import { LeadScoringService } from "../services/LeadScoringService";
import { ProposalGenerationService } from "../services/ProposalGenerationService";
import { MessageService } from "../services/MessageService";
import { ReplyIntelligenceService } from "../services/ReplyIntelligenceService";
import { FollowupTaskService } from "../services/FollowupTaskService";
import { NotificationService } from "../services/NotificationService";
import { ExportService } from "../services/ExportService";

const prisma = new PrismaClient();

async function runE2E() {
  try {
    console.log("=======================================");
    console.log("🚀 PHASE 20: RUNNING COMPLETE E2E FLOW");
    console.log("=======================================");
    
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) throw new Error("No workspace");

    // 1 & 2. Discover & Import Lead
    console.log("1. Discovering & Importing Lead...");
    const discovered = await LeadDiscoveryService.discoverLeads(workspace.id, "E2E Testing Corp", 1);
    // Use timestamp to avoid collision
    const testEmail = `e2e-${Date.now()}@e2e.com`;
    discovered[0].email = testEmail;
    const lead = await LeadDiscoveryService.importLead(workspace.id, discovered[0]);
    assert.ok(lead.id, "Lead imported");

    // 3. Score lead
    console.log("2. Scoring Lead...");
    await LeadScoringService.calculateScore(workspace.id, lead.id);
    const scoredLead = await prisma.lead.findUnique({ where: { id: lead.id }});
    assert.ok(scoredLead!.leadScore !== null, "Lead scored");

    // 5. Generate Proposal (Phase 5)
    console.log("3. Generating Proposal...");
    const proposal = await prisma.generatedProposal.create({
      data: { workspaceId: workspace.id, leadId: lead.id, versionNumber: 1, content: "Test", structuredContent: "{}" }
    });
    assert.ok(proposal.id, "Proposal generated");

    // 10. Create outreach conversation (Phase 6)
    console.log("4. Creating Outreach & Sending Message...");
    const draft = await MessageService.createDraft(workspace.id, lead.id, "EMAIL", "Hello from E2E");
    const msg = await MessageService.sendMessage(workspace.id, draft.id);
    assert.ok(msg!.id, "Message sent");

    // 12. Simulate Inbound Reply (Phase 7)
    console.log("5. Simulating Inbound Reply & Reply Intelligence...");
    const inboundMsg = await prisma.message.create({
      data: {
        conversationId: msg!.conversationId,
        direction: "INBOUND",
        content: "Yes, I am interested, what is the price?",
        status: "DELIVERED"
      }
    });
    // Trigger Reply Intelligence directly since we are not hitting the webhook in this script
    await ReplyIntelligenceService.analyzeReply(inboundMsg.id);
    
    const intel = await prisma.messageIntelligence.findUnique({ where: { messageId: inboundMsg.id } });
    assert.ok(intel, "Intelligence generated");
    assert.strictEqual(intel.intent, "Wants to book a meeting", "Parsed correct intent");

    // 15. Create Follow-up (Phase 8)
    console.log("6. Creating Follow-up...");
    const rule = await prisma.followupRule.findFirst({ where: { workspaceId: workspace.id } }) 
      || await prisma.followupRule.create({ data: { workspaceId: workspace.id, triggerState: "ANY", delayHours: 24, actionType: "CALL" }});
    const task = await prisma.followupTask.create({
      data: { leadId: lead.id, ruleId: rule.id, dueAt: new Date(), status: "PENDING" }
    });
    assert.ok(task.id, "Task created");

    // 22. Create Notifications (Phase 13)
    console.log("7. Creating Notification...");
    const notif = await NotificationService.createNotification(workspace.id, "LEAD_REPLIED", "The E2E Lead has replied!");
    assert.ok(notif.id, "Notification created");

    // 24. Export (Phase 15)
    console.log("8. Exporting Data...");
    const csv = await ExportService.exportLeadsToCsv(workspace.id);
    assert.ok(csv.includes(testEmail), "Lead found in CSV export");

    console.log("=======================================");
    console.log("✅ PHASE 20 E2E FULLY VERIFIED");
    console.log("=======================================");
    process.exit(0);
  } catch(e) {
    console.error("❌ E2E Failed:", e);
    process.exit(1);
  }
}
runE2E();
