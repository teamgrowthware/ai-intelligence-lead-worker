import { prisma } from "../auth";
import { JobService } from "../services/JobService";

async function run() {
  console.log("🚀 Starting Event-Driven Architecture Verification");
  
  const workspaceId = "WORKSPACE_A";
  
  // 1. Clear Jobs
  await prisma.job.deleteMany({});
  await prisma.jobLog.deleteMany({});
  
  // 2. Mock a Campaign execution
  console.log("Mocking Campaign Trigger...");
  await JobService.enqueue("CAMPAIGN_EXECUTION", { campaignId: "fake-campaign-id" }, new Date(), "test-campaign-exec");
  
  // 3. Process jobs
  console.log("Processing Jobs...");
  await JobService.processNextJobs(10);
  
  const logs = await prisma.jobLog.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log("Job Logs:", logs);
  
  console.log("✅ Event-driven verification complete!");
}

run().catch(console.error).finally(() => process.exit(0));
