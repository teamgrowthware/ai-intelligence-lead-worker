export type DomainEventName =
  | "lead.created"
  | "lead.enriched"
  | "proposal.generated"
  | "proposal.approved"
  | "proposal.sent"
  | "message.sent"
  | "message.delivered"
  | "message.read"
  | "message.failed"
  | "lead.replied"
  | "reply.classified"
  | "followup.due"
  | "followup.sent"
  | "lead.interested"
  | "lead.won"
  | "lead.lost";

export interface DomainEventPayload {
  eventId: string;
  eventName: DomainEventName;
  timestamp: Date;
  workspaceId: string;
  data: Record<string, unknown>;
}

export class EventBus {
  /**
   * Publishes a domain event to the queue for asynchronous processing.
   * Currently acts as a placeholder for BullMQ/Redis integration.
   */
  static async publish(
    eventName: DomainEventName,
    workspaceId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const eventPayload: DomainEventPayload = {
      eventId: crypto.randomUUID(),
      eventName,
      timestamp: new Date(),
      workspaceId,
      data,
    };
    
    // In production, this pushes to the Redis queue.
    console.log(`[EventBus] Publishing ${eventName}`, eventPayload);
  }
}
