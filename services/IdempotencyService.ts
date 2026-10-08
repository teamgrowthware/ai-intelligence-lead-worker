import { prisma } from "@/auth";

export class IdempotencyService {
  /**
   * Checks if an operation has already been performed.
   * If not, it reserves the idempotency key to prevent race conditions.
   * @param key A unique identifier for the specific operation
   * @param actionType The type of action (e.g., 'process_webhook')
   * @param ttlSeconds How long the key should be preserved (default 24h)
   * @returns true if this is the first execution, false if it's a duplicate
   */
  static async reserve(key: string, actionType: string, ttlSeconds: number = 86400): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      // We use create to enforce the unique constraint. 
      // If it exists, it throws a PrismaClientKnownRequestError (P2002).
      await prisma.idempotencyKey.create({
        data: {
          key,
          actionType,
          expiresAt,
        },
      });
      
      return true; // We successfully reserved the key
    } catch (error: unknown) {
      // P2002 is the unique constraint violation code for Prisma
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === 'P2002') {
        return false; // Duplicate execution
      }
      throw error;
    }
  }

  /**
   * Stores the result of an operation so it can be returned safely on duplicate calls.
   */
  static async recordResult(key: string, responseStatus: number, responseBody: Record<string, unknown>): Promise<void> {
    await prisma.idempotencyKey.update({
      where: { key },
      data: {
        responseStatus,
        responseBody: JSON.stringify(responseBody),
      },
    });
  }

  /**
   * Cleans up expired idempotency keys. 
   * Meant to be run as a cron job.
   */
  static async cleanupExpiredKeys(): Promise<number> {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  static async release(key: string): Promise<void> {
    await prisma.idempotencyKey.delete({ where: { key } }).catch(() => {});
  }
}
