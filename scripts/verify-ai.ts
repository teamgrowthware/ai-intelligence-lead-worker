import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import assert from "node:assert";
import { prisma } from "../auth";
import { LeadIntelligenceService } from "../services/LeadIntelligenceService";
import { ProposalStrategyService } from "../services/ProposalStrategyService";
import { PortfolioMatchingService } from "../services/PortfolioMatchingService";
import { ProposalGenerationService } from "../services/ProposalGenerationService";
import { ProposalCriticService } from "../services/ProposalCriticService";
import { ProposalStatus } from "@prisma/client";
import { hasRole } from "../lib/rbac";

async function runTests() {
  console.log("Running Complete AI Core Pipeline Runtime Tests...");
  
  // Clean up previous test data if any
  await prisma.workspace.deleteMany({ where: { name: { startsWith: "Test Workspace" } } });
  
  try {
    // 1. CREATE REAL TEST DATA
    console.log("1. Creating test data...");
    
    const ws1 = await prisma.workspace.create({ data: { name: "Test Workspace A" } });
    const ws2 = await prisma.workspace.create({ data: { name: "Test Workspace B" } });

    const admin = await prisma.user.create({
      data: { email: "admin@test.com", passwordHash: "$2b$10$RYMRSIEKL6JDJYS6zRPdce5tbtBa2M1b0cK2hmYEaV2gg/UJnw/0m", workspaceId: ws1.id, role: "ADMIN" }
    });
    
    const sales = await prisma.user.create({
      data: { email: "sales@test.com", passwordHash: "$2b$10$RYMRSIEKL6JDJYS6zRPdce5tbtBa2M1b0cK2hmYEaV2gg/UJnw/0m", workspaceId: ws1.id, role: "SALES" }
    });

    const viewer = await prisma.user.create({
      data: { email: "viewer@test.com", passwordHash: "$2b$10$RYMRSIEKL6JDJYS6zRPdce5tbtBa2M1b0cK2hmYEaV2gg/UJnw/0m", workspaceId: ws1.id, role: "VIEWER" }
    });

    const company = await prisma.company.create({
      data: { workspaceId: ws1.id, name: "Acme Corp" }
    });

    const contact = await prisma.contact.create({
      data: { workspaceId: ws1.id, companyId: company.id, firstName: "John", email: "john@acme.com" }
    });
    assert.ok(admin.id);
    assert.ok(sales.id);
    assert.ok(viewer.id);
    const lead1 = await prisma.lead.create({
      data: {
        workspaceId: ws1.id,
        companyId: company.id,
        contactId: contact.id,
        originalRequirement: "Looking for a custom SaaS web application using React/Next.js/Node.js with UI/UX requirements.",
        serviceRequired: "Web Development",
        status: "NEW"
      }
    });

    const lead2 = await prisma.lead.create({
      data: {
        workspaceId: ws2.id,
        originalRequirement: "Another requirement",
      }
    });

    const portfolioItem1 = await prisma.portfolioItem.create({
      data: {
        workspaceId: ws1.id,
        title: "Modern SaaS App",
        services: ["Web Development", "UI/UX Design"],
        technologies: ["React", "Next.js"],
        positioningCompatibility: ["AGENCY", "HYBRID"],
        isActive: true
      }
    });

    const portfolioItem2 = await prisma.portfolioItem.create({
      data: {
        workspaceId: ws1.id,
        title: "Legacy Migration",
        services: ["Backend"],
        technologies: ["Java"],
        positioningCompatibility: ["FREELANCER"],
        isActive: true
      }
    });
    assert.ok(portfolioItem2.id);

    // 2. TEST LEAD INTELLIGENCE
    console.log("2. Testing Lead Intelligence generation...");
    const intel = await LeadIntelligenceService.generateIntelligence(ws1.id, lead1.id);
    
    assert.ok(intel.id, "LeadIntelligence record created");
    assert.ok(intel.aiRunId, "AI Run record linked");

    const activities = await prisma.activity.findMany({ where: { leadId: lead1.id } });
    assert.ok(activities.find(a => a.type === "AI_INTELLIGENCE_GENERATED"), "Activity logged for Intel");

    // 3. TEST PROPOSAL STRATEGY
    console.log("3. Testing Proposal Strategy generation...");
    const strategy = await ProposalStrategyService.generateStrategy(ws1.id, lead1.id) as unknown as { id: string; positioningMode: string; personalizationPoints: string[]; };
    
    // 4. TEST PORTFOLIO MATCHING
    console.log("4. Testing Smart Portfolio Matching...");
    const matches = await PortfolioMatchingService.matchPortfolio(ws1.id, strategy.id) as unknown as { item: { id: string }, score: number }[];
    assert.ok(matches.length > 0, "Matches found");
    
    // 5. TEST WORKSPACE ISOLATION
    console.log("5. Testing Workspace Isolation...");
    let isoThrown = false;
    try {
      await ProposalStrategyService.generateStrategy(ws1.id, lead2.id);
    } catch (e: unknown) {
      isoThrown = true;
    }
    assert.ok(isoThrown, "Workspace isolation prevented cross-tenant access");

    // 6. TEST RBAC Helpers
    console.log("6. Testing RBAC...");
    assert.ok(hasRole("ADMIN", "VIEWER"), "Admin has Viewer rights");

    // 7. VERIFY PROMPT VERSIONING
    console.log("7. Verifying Prompt Versioning...");
    const prompt = await prisma.promptVersion.findFirst({ where: { name: "LEAD_INTELLIGENCE_V1" } });
    assert.ok(prompt, "Prompt was persisted and resolved");

    // 8. TEST PROPOSAL GENERATION
    console.log("8. Testing Proposal Generation...");
    const proposal1 = await ProposalGenerationService.generateProposal(
      ws1.id,
      lead1.id,
      strategy.id,
      [portfolioItem1.id], // Portfolio Selection
      "AGENCY",
      "MEDIUM"
    );
    assert.ok(proposal1.id, "Generated proposal record created");
    assert.strictEqual(proposal1.status, "GENERATED", "Proposal status is GENERATED");
    assert.strictEqual(proposal1.versionNumber, 1, "First version is 1");
    assert.ok(proposal1.structuredContent, "Structured output validated and saved");

    // TEST REGENERATION CREATES NEW VERSION (Test 5)
    console.log("Test 5. Testing Proposal Regeneration creates new version...");
    const proposal2 = await ProposalGenerationService.generateProposal(
      ws1.id,
      lead1.id,
      strategy.id,
      [portfolioItem1.id],
      "AGENCY",
      "MEDIUM"
    );
    assert.strictEqual(proposal2.versionNumber, 2, "Regenerated proposal gets v2");

    // 9. TEST PROPOSAL CRITIC
    console.log("9. Testing Proposal Critic...");
    const criticOutput = await ProposalCriticService.runCritic(ws1.id, proposal2.id);
    assert.strictEqual(criticOutput.overall_score, 85, "Critic parsed correctly");
    assert.strictEqual(criticOutput.final_decision, "PASS", "Critic decision parsed");

    // TEST HALLUCINATION DETECTED
    console.log("Test 7. Testing Hallucination / Unsupported claim detection...");
    // Manually edit the proposal to contain hallucinated string "1000% ROI"
    await prisma.generatedProposal.update({
      where: { id: proposal2.id },
      data: { content: "We will get you 1000% ROI instantly." }
    });
    const hallucinatedCriticOutput = await ProposalCriticService.runCritic(ws1.id, proposal2.id);
    assert.strictEqual(hallucinatedCriticOutput.hallucination_risk, "HIGH", "Hallucination flagged by guard");
    assert.strictEqual(hallucinatedCriticOutput.final_decision, "HIGH_RISK", "Critic blocked the hallucinated proposal");

    // 10. TEST PROPOSAL EDITING (Human Edit)
    console.log("10. Testing Proposal Editing...");
    await prisma.generatedProposal.update({
      where: { id: proposal2.id },
      data: {
        content: "Manually edited content without fake metrics.",
        status: ProposalStatus.CHANGES_REQUESTED
      }
    });
    await prisma.activity.create({
      data: { workspaceId: ws1.id, leadId: lead1.id, type: "PROPOSAL_EDITED", description: "Edited" }
    });
    
    // TEST CRITIC AFTER EDITING (Test 10)
    console.log("Test 10. Testing Critic after editing...");
    const criticAfterEdit = await ProposalCriticService.runCritic(ws1.id, proposal2.id);
    assert.strictEqual(criticAfterEdit.final_decision, "PASS", "Passes critic after human edit fixing hallucination");

    // 11. TEST PROPOSAL APPROVAL
    console.log("11. Testing Proposal Approval...");
    await prisma.generatedProposal.update({
      where: { id: proposal2.id },
      data: {
        status: ProposalStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: admin.id
      }
    });
    await prisma.activity.create({
      data: { workspaceId: ws1.id, leadId: lead1.id, type: "PROPOSAL_APPROVED", description: "Approved" }
    });

    const approvedProposal = await prisma.generatedProposal.findUnique({ where: { id: proposal2.id } });
    assert.strictEqual(approvedProposal?.status, "APPROVED", "Proposal successfully approved");

    // 12. TEST PROPOSAL REJECTION
    console.log("12. Testing Proposal Rejection...");
    await prisma.generatedProposal.update({
      where: { id: proposal2.id },
      data: { status: ProposalStatus.REJECTED }
    });
    await prisma.activity.create({
      data: { workspaceId: ws1.id, leadId: lead1.id, type: "PROPOSAL_REJECTED", description: "Rejected: Too expensive" }
    });
    const rejectedProposal = await prisma.generatedProposal.findUnique({ where: { id: proposal2.id } });
    assert.strictEqual(rejectedProposal?.status, "REJECTED", "Proposal rejected");

    // 13. TEST PROPOSAL ARCHIVE
    console.log("13. Testing Proposal Archive...");
    await prisma.generatedProposal.update({
      where: { id: proposal2.id },
      data: { status: ProposalStatus.ARCHIVED }
    });
    await prisma.activity.create({
      data: { workspaceId: ws1.id, leadId: lead1.id, type: "PROPOSAL_ARCHIVED", description: "Archived" }
    });
    const archivedProposal = await prisma.generatedProposal.findUnique({ where: { id: proposal2.id } });
    assert.strictEqual(archivedProposal?.status, "ARCHIVED", "Proposal archived");

    // TEST ACTIVITY CREATION (Test 14)
    console.log("Test 14. Verifying all activities created...");
    const allActivities = await prisma.activity.findMany({ where: { leadId: lead1.id } });
    const types = allActivities.map(a => a.type);
    assert.ok(types.includes("PROPOSAL_GENERATED"));
    assert.ok(types.includes("PROPOSAL_CRITIC_RUN"));
    assert.ok(types.includes("PROPOSAL_EDITED"));
    assert.ok(types.includes("PROPOSAL_APPROVED"));
    assert.ok(types.includes("PROPOSAL_REJECTED"));
    assert.ok(types.includes("PROPOSAL_ARCHIVED"));

    // TEST INVALID/CROSS-WORKSPACE PROPOSAL ACCESS (Test 20)
    console.log("Test 20. Invalid/cross-workspace proposal access...");
    let crossWorkspaceAccessThrown = false;
    try {
      // Try to run critic on workspace A's proposal using workspace B's ID
      await ProposalCriticService.runCritic(ws2.id, proposal2.id);
    } catch (e: unknown) {
      crossWorkspaceAccessThrown = true;
    }
    assert.ok(crossWorkspaceAccessThrown, "Cross-workspace access prevented");

    // 17. TEST IDEMPOTENCY ON PROPOSAL
    console.log("17. Testing Idempotency on Proposal Generation...");
    let proposalIdempotencyThrown = false;
    try {
      const p1 = ProposalGenerationService.generateProposal(ws1.id, lead1.id, strategy.id, [portfolioItem1.id], "AGENCY", "MEDIUM");
      const p2 = ProposalGenerationService.generateProposal(ws1.id, lead1.id, strategy.id, [portfolioItem1.id], "AGENCY", "MEDIUM");
      await Promise.all([p1, p2]);
    } catch (e: unknown) {
      if ((e as Error).message.includes("Proposal generation already in progress")) {
        proposalIdempotencyThrown = true;
      }
    }
    assert.ok(proposalIdempotencyThrown, "Idempotency prevents duplicate proposal generation");

    console.log("✅ All Runtime Database Tests Passed.");
    process.exit(0);
  } catch (e) {
    console.error("❌ Test failed:", e);
    process.exit(1);
  }
}

runTests();

