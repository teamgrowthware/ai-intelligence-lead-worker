import { prisma } from "@/auth";
import { MessageService } from "./MessageService";
import { JobService } from "./JobService";

export class FollowupTaskService {
  static async getTasks(workspaceId: string, status?: string) {
    return prisma.followupTask.findMany({
      where: { 
        lead: { workspaceId },
        ...(status ? { status: status as import("@prisma/client").FollowupTaskStatus } : {})
      },
      include: { lead: true, rule: true },
      orderBy: { dueAt: 'asc' }
    });
  }

  static async completeTask(workspaceId: string, taskId: string) {
    const task = await prisma.followupTask.findUnique({ where: { id: taskId }, include: { lead: true } });
    if (!task || task.lead.workspaceId !== workspaceId) throw new Error("Unauthorized");
    return prisma.followupTask.update({ where: { id: taskId }, data: { status: "EXECUTED" } });
  }

  static async cancelTask(workspaceId: string, taskId: string) {
    const task = await prisma.followupTask.findUnique({ where: { id: taskId }, include: { lead: true } });
    if (!task || task.lead.workspaceId !== workspaceId) throw new Error("Unauthorized");
    return prisma.followupTask.update({ where: { id: taskId }, data: { status: "CANCELLED" } });
  }

  static async queueDueTasks() {
    const dueTasks = await prisma.followupTask.findMany({
      where: {
        status: "PENDING",
        dueAt: { lte: new Date() }
      }
    });

    for (const task of dueTasks) {
      const idempotencyKey = `followup:${task.id}`;
      await JobService.enqueue("FOLLOWUP_EXECUTION", { taskId: task.id }, new Date(), idempotencyKey);
    }
  }

  static async executeTask(taskId: string) {
    const task = await prisma.followupTask.findUnique({
      where: { id: taskId },
      include: { lead: true, rule: true }
    });

    if (!task || task.status !== "PENDING") {
      console.warn(`Task ${taskId} is already processed or not pending.`);
      return;
    }

    const { IdempotencyService } = await import("./IdempotencyService");
    const idemKey = `followup_exec_${taskId}`;
    const isFirst = await IdempotencyService.reserve(idemKey, "FOLLOWUP_EXECUTION");
    if (!isFirst) {
      console.warn(`Idempotency caught duplicate execution of followup task ${taskId}`);
      return;
    }

    const lead = task.lead;
    const workspaceId = lead.workspaceId;

    // Send a message if it's an EMAIL or WHATSAPP follow-up
    if (["EMAIL", "WHATSAPP"].includes(task.rule.actionType)) {
      const channel = task.rule.actionType as "EMAIL" | "WHATSAPP";
      const draft = await MessageService.createDraft(
        workspaceId, 
        lead.id, 
        channel, 
        "Just following up to see if you had any thoughts on my previous message."
      );
      await MessageService.sendMessage(workspaceId, draft.id);
    }

    await prisma.followupTask.update({
      where: { id: taskId },
      data: { status: "EXECUTED" }
    });

    await prisma.activity.create({
      data: {
        workspaceId,
        leadId: lead.id,
        type: "FOLLOWUP_EXECUTED",
        description: `Follow-up task for rule ${task.rule.actionType} executed.`
      }
    });

    // Notify
    await JobService.enqueue("NOTIFICATION", {
      workspaceId,
      type: "FOLLOWUP_EXECUTED",
      message: `Follow-up sent for lead ${lead.email || lead.id}`
    });

    // Rescore
    await JobService.enqueue("LEAD_SCORING", {
      workspaceId,
      leadId: lead.id
    });
  }
}
