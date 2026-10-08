import { prisma } from "@/auth";

export class LeadScoringService {
  static async calculateScore(workspaceId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { 
        conversations: { include: { messages: true } },
        intelligence: true,
        proposals: true
      }
    });

    if (!lead || lead.workspaceId !== workspaceId) return;

    let score = 0;
    
    // Base score from status
    if (lead.status === "NEW") score += 10;
    if (lead.status === "QUALIFIED") score += 30;
    if (lead.status === "INTERESTED") score += 50;
    if (lead.status === "MEETING_BOOKED") score += 70;
    if (lead.status === "WON") score += 100;
    if (lead.status === "LOST" || lead.status === "NOT_INTERESTED") score = 0;

    // Intelligence fit
    if (lead.intelligence?.fitScore) {
      score += Math.floor(lead.intelligence.fitScore / 2);
    }

    // Engagement
    const totalMessages = lead.conversations.reduce((acc, c) => acc + c.messages.length, 0);
    score += Math.min(totalMessages * 5, 20);

    // If score is the same, do nothing to prevent infinite loops
    if (lead.leadScore === score) return;

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { leadScore: score }
    });

    await prisma.activity.create({
      data: {
        workspaceId,
        leadId,
        type: "LEAD_SCORE_UPDATED",
        description: `Lead score updated to ${score}`
      }
    });

    return updatedLead;
  }
}
