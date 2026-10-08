import { prisma } from "@/auth";

export class PortfolioMatchingService {
  /**
   * Evaluates all workspace portfolio items and case studies against the generated Proposal Strategy
   * and Lead Intelligence, returning ranked matches.
   */
  static async matchPortfolio(workspaceId: string, strategyId: string): Promise<Record<string, unknown>[]> {
    const strategy = await prisma.proposalStrategy.findUnique({
      where: { id: strategyId },
      include: { lead: { include: { intelligence: true } } }
    });

    if (!strategy) throw new Error("Proposal Strategy not found");

    const items = await prisma.portfolioItem.findMany({
      where: { workspaceId, isActive: true }
    });

    // Semantic matching placeholder: 
    // In production, this would use pgvector (vector similarity) or pass the catalog to an LLM.
    // For Phase 4, we do a basic keyword match heuristic.
    const requiredServices = strategy.recommendedService?.toLowerCase() || "";
    
    const matches = items.map(item => {
      let score = 0;
      const reasons: string[] = [];

      item.services.forEach(s => {
        if (requiredServices.includes(s.toLowerCase())) {
          score += 30;
          reasons.push(`Matches recommended service: ${s}`);
        }
      });

      if (strategy.positioningMode && item.positioningCompatibility?.includes(strategy.positioningMode)) {
        score += 20;
        reasons.push(`Compatible with ${strategy.positioningMode} positioning`);
      }

      return {
        item,
        score,
        reasons,
      };
    });

    // Filter and sort
    const topMatches = matches
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // top 3

    // Update the strategy with the matches (JSON string)
    await prisma.proposalStrategy.update({
      where: { id: strategyId },
      data: {
        portfolioMatches: JSON.stringify(topMatches.map(m => ({
          id: m.item.id,
          title: m.item.title,
          score: m.score,
          reasons: m.reasons
        })))
      }
    });

    await prisma.activity.create({
      data: {
        workspaceId,
        leadId: strategy.leadId,
        type: "PORTFOLIO_MATCH_GENERATED",
        description: `Matched ${topMatches.length} portfolio items.`,
      }
    });

    return topMatches;
  }
}
