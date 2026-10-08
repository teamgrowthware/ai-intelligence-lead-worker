import { prisma } from "@/auth";

export class NotificationService {
  static async createNotification(workspaceId: string, type: string, message: string) {
    return prisma.notification.create({
      data: { workspaceId, type, message }
    });
  }

  static async markAsRead(workspaceId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, workspaceId },
      data: { read: true }
    });
  }

  static async getUnreadCount(workspaceId: string) {
    return prisma.notification.count({
      where: { workspaceId, read: false }
    });
  }
}
