import { prisma } from "@/auth";

export class AuditLogService {
  static async log(workspaceId: string, userId: string | null, action: string, entityType: string, entityId: string, ipAddress?: string) {
    return prisma.auditLog.create({
      data: { workspaceId, userId, action, entityType, entityId, ipAddress }
    });
  }
}
