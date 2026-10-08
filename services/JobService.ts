import { prisma } from "@/auth";
import { JobProcessor } from "./JobProcessor";

export class JobService {
  static async enqueue(type: string, payload: any, runAt: Date = new Date(), idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await prisma.job.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;
    }
    return prisma.job.create({
      data: {
        type,
        payload: JSON.stringify(payload),
        runAt,
        idempotencyKey
      }
    });
  }

  static async processNextJobs(limit = 10) {
    const now = new Date();
    const pendingJobs = await prisma.job.findMany({
      where: {
        status: "QUEUED",
        runAt: { lte: now }
      },
      take: limit,
      orderBy: { runAt: "asc" }
    });

    for (const job of pendingJobs) {
      const locked = await prisma.job.updateMany({
        where: { id: job.id, status: "QUEUED" },
        data: { status: "RUNNING", lockedAt: now }
      });
      if (locked.count === 0) continue;

      try {
        const payload = JSON.parse(job.payload);
        await this.executeJob(job.type, payload);
        
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "COMPLETED" }
        });

        await prisma.jobLog.create({
          data: { jobId: job.id, queueName: "default", status: "COMPLETED" }
        });
      } catch (e: any) {
        const retries = job.retryCount + 1;
        const status = retries >= job.maxRetries ? "FAILED" : "QUEUED";
        const nextRunAt = new Date(Date.now() + 1000 * 60 * Math.pow(2, retries));
        
        await prisma.job.update({
          where: { id: job.id },
          data: { 
            status, 
            retryCount: retries, 
            error: e.message || String(e),
            runAt: status === "QUEUED" ? nextRunAt : job.runAt
          }
        });

        await prisma.jobLog.create({
          data: { jobId: job.id, queueName: "default", status, error: e.message || String(e) }
        });
      }
    }
  }

  static async executeJob(type: string, payload: any) {
    return JobProcessor.process(type, payload);
  }
}
