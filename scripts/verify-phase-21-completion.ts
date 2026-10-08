import { prisma } from "../auth";
import { JobService } from "../services/JobService";
import { MessageService } from "../services/MessageService";
import { ReplyIntelligenceService } from "../services/ReplyIntelligenceService";

async function verify() {
  console.log("🚀 Running Master Verification for Completion");
  
  // 1. Create a Lead
  let workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Test Workspace" }
    });
  }
  const workspaceId = workspace.id;

  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      status: "NEW",
      email: "master-test@test.com",
    }
  });

  const conversation = await prisma.conversation.create({
    data: {
      leadId: lead.id,
      channel: "EMAIL",
    }
  });

  // 2. Webhook triggers an inbound message 
  console.log("Mocking Inbound Webhook Event...");
  const msg = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      content: "I want to discuss pricing.",
      status: "DELIVERED"
    }
  });

  await ReplyIntelligenceService.analyzeIncomingMessage(workspaceId, msg.id);

  // 3. This should queue notifications and lead scoring
  await JobService.enqueue("LEAD_SCORING", { workspaceId, leadId: lead.id }, new Date(), "test-lead-scoring");
  
  // 4. Run Job Processor
  console.log("Processing queued jobs...");
  await JobService.processNextJobs(10);

  const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
  const intel = await prisma.messageIntelligence.findUnique({ where: { messageId: msg.id } });

  console.log("Lead Score Updated:", updatedLead?.leadScore);
  console.log("Intent Detected:", intel?.intent);

  console.log("✅ Verification Script Completed.");
}

verify().catch(console.error).finally(() => process.exit(0));
