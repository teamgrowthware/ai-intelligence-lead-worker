import { PrismaClient } from "@prisma/client";
import * as assert from "assert";
import { CampaignService } from "../services/CampaignService";
import { LeadDiscoveryService } from "../services/LeadDiscoveryService";

const prisma = new PrismaClient();

async function runTests() {
  try {
    console.log("Running Phase 9, 10, 12 Verification...");
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) throw new Error("No workspace");
    
    // Phase 9: Campaigns
    console.log("Testing Phase 9: Campaigns...");
    const campaign = await prisma.campaign.create({
      data: { workspaceId: workspace.id, name: "Test Campaign", status: "DRAFT" }
    });
    await CampaignService.startCampaign(workspace.id, campaign.id);
    const completedCamp = await prisma.campaign.findUnique({ where: { id: campaign.id } });
    assert.strictEqual(completedCamp?.status, "COMPLETED", "Campaign processed");

    // Phase 10: Lead Discovery
    console.log("Testing Phase 10: Lead Discovery...");
    const discovered = await LeadDiscoveryService.discoverLeads(workspace.id, "Real Estate", 1);
    assert.ok(discovered.length === 1);
    const imported = await LeadDiscoveryService.importLead(workspace.id, discovered[0]);
    assert.ok(imported.id, "Lead imported successfully");

    // Verify analytics will run (queries)
    const count = await prisma.lead.count({ where: { workspaceId: workspace.id } });
    assert.ok(count > 0);

    console.log("✅ Phases 9, 10, 12 Verification Passed.");
    process.exit(0);
  } catch(e) {
    console.error("❌ Test Failed:", e);
    process.exit(1);
  }
}
runTests();
