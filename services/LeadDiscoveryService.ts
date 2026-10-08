import { prisma } from "@/auth";

export class LeadDiscoveryService {
  static async discoverLeads(workspaceId: string, industry: string, limit: number = 5) {
    const mocks = [];
    for (let i = 0; i < limit; i++) {
      mocks.push({
        companyName: `Discovered ${industry} Corp ${i}`,
        email: `contact${i}@${industry.toLowerCase().replace(/\s/g, '')}.com`,
        industry,
      });
    }
    return mocks;
  }

  static async importLead(workspaceId: string, data: {companyName: string; email: string; industry: string}) {
    // Basic deduplication
    const existing = await prisma.lead.findFirst({
      where: { workspaceId, email: data.email }
    });
    if (existing) throw new Error("Duplicate Lead");

    const company = await prisma.company.create({
      data: { workspaceId, name: data.companyName, industry: data.industry }
    });
    
    return prisma.lead.create({
      data: {
        workspaceId,
        companyId: company.id,
        email: data.email,
        source: "DISCOVERY",
        status: "NEW"
      }
    });
  }
}
