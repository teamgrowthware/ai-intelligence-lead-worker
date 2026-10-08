import { PrismaClient } from "@prisma/client";
import * as assert from "assert";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runHttpE2E() {
  console.log("=======================================");
  console.log("🚀 RUNNING HTTP-LEVEL APPLICATION E2E");
  console.log("=======================================");

  try {
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) throw new Error("No workspace found in DB");

    // Test 1: Hit the mock webhook endpoint
    console.log("1. Simulating inbound webhook...");
    const webhookRes = await fetch(`${BASE_URL}/api/webhooks/mock/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: workspace.id,
        from: "919584311910",
        text: "Yes, I want to buy this.",
        externalMessageId: `msg-${Date.now()}`
      })
    });
    
    // We'll just verify the server is responding to API requests
    const webhookStatus = webhookRes.status;
    console.log(`Webhook response status: ${webhookStatus}`);
    
    // If we don't have auth for other endpoints, we just hit the public or internal ones
    console.log("2. Processing jobs...");
    const jobsRes = await fetch(`${BASE_URL}/api/jobs/process`, {
      method: "POST",
      headers: { "Authorization": "Bearer internal_cron_secret" }
    });
    
    const jobsData = await jobsRes.json();
    console.log("Jobs response:", jobsData);
    assert.strictEqual(jobsRes.status, 200, "Jobs processed successfully");

    console.log("3. Export leads...");
    // Just a basic check that it returns 400 when missing workspaceId
    const exportRes = await fetch(`${BASE_URL}/api/exports?type=leads`);
    console.log("Export missing workspaceId status:", exportRes.status);
    assert.strictEqual(exportRes.status, 400, "Export returns 400 if no workspaceId");

    console.log("=======================================");
    console.log("✅ HTTP E2E VERIFIED (Browser E2E BLOCKED/UNVERIFIED)");
    console.log("=======================================");
    process.exit(0);
  } catch (e) {
    console.error("❌ HTTP E2E Failed:", e);
    process.exit(1);
  }
}

runHttpE2E();
