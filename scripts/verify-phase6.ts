import { PrismaClient } from "@prisma/client";
import * as assert from "assert";
import { MessageService } from "../services/MessageService";

const prisma = new PrismaClient();

async function runTests() {
  try {
    console.log("Running Phase 6 E2E Test...");
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) throw new Error("No workspace");
    const lead = await prisma.lead.findFirst({ where: { workspaceId: workspace.id } });
    if (!lead) throw new Error("No lead");

    console.log("1. Creating Draft...");
    const draft = await MessageService.createDraft(workspace.id, lead.id, "EMAIL", "Test Phase 6 E2E");
    assert.strictEqual(draft.status, "DRAFT");

    console.log("2. Sending Message...");
    const sent = await MessageService.sendMessage(workspace.id, draft.id);
    assert.strictEqual(sent!.status, "SENT");

    console.log("3. Verifying Event Logs...");
    const events = await prisma.messageEvent.findMany({ where: { messageId: draft.id } });
    assert.ok(events.length > 0, "Events generated");

    console.log("4. Testing filters...");
    const filtered = await MessageService.getConversations(workspace.id, "", "EMAIL");
    assert.ok(filtered.length > 0, "Filters working");

    console.log("✅ Phase 6 FULLY VERIFIED.");
    process.exit(0);
  } catch(e) {
    console.error("❌ Phase 6 Failed:", e);
    process.exit(1);
  }
}
runTests();
