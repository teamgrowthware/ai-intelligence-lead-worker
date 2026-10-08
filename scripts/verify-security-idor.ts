import { PrismaClient } from "@prisma/client";
import * as assert from "assert";
import { MessageService } from "../services/MessageService";
import { FollowupTaskService } from "../services/FollowupTaskService";

const prisma = new PrismaClient();

async function runIDORTest() {
  console.log("=======================================");
  console.log("🚀 RUNNING CROSS-WORKSPACE IDOR TESTS");
  console.log("=======================================");

  try {
    // Create two separate workspaces
    const wsA = await prisma.workspace.create({ data: { name: "Workspace A" } });
    const wsB = await prisma.workspace.create({ data: { name: "Workspace B" } });

    // Create a lead in Workspace A
    const leadA = await prisma.lead.create({
      data: { workspaceId: wsA.id, email: "leadA@test.com", status: "NEW" }
    });

    // Create a followup task in Workspace A
    const ruleA = await prisma.followupRule.create({ data: { workspaceId: wsA.id, triggerState: "ANY", delayHours: 24, actionType: "EMAIL" }});
    const taskA = await prisma.followupTask.create({ data: { leadId: leadA.id, ruleId: ruleA.id, dueAt: new Date() }});

    console.log("Attempting unauthorized Followup execution...");
    let caught = false;
    try {
      // workspace B attempts to complete task A
      await FollowupTaskService.completeTask(wsB.id, taskA.id);
    } catch (e: any) {
      caught = true;
      assert.strictEqual(e.message, "Unauthorized", "Must throw unauthorized");
    }
    assert.ok(caught, "IDOR prevented on Followup complete");

    console.log("Attempting unauthorized Message Draft creation...");
    caught = false;
    try {
      // Workspace B tries to send message to Lead A
      await MessageService.createDraft(wsB.id, leadA.id, "EMAIL", "Hack");
    } catch (e: any) {
      caught = true;
      assert.ok(e.message.includes("does not belong"), "Must throw ownership error");
    }
    assert.ok(caught, "IDOR prevented on Message creation");

    console.log("=======================================");
    console.log("✅ SECURITY IDOR TEST PASSED");
    console.log("=======================================");
    process.exit(0);
  } catch(e) {
    console.error("❌ IDOR Test Failed:", e);
    process.exit(1);
  }
}

runIDORTest();
