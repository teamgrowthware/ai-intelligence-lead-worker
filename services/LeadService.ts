import { prisma } from "@/auth";
import { LeadStatus } from "@prisma/client";

export class LeadService {
  static async createLead(workspaceId: string, data: Record<string, string>, userId: string) {
    return await prisma.$transaction(async (tx) => {
      let company = null;
      if (data.companyName) {
        company = await tx.company.create({
          data: {
            workspaceId,
            name: data.companyName,
            domain: data.domain || null,
            website: data.website || null,
            industry: data.industry || null,
            companySize: data.companySize || null,
            country: data.companyCountry || null,
            city: data.companyCity || null,
            linkedinUrl: data.companyLinkedinUrl || null,
            description: data.companyDescription || null,
          }
        });
      }

      const contact = await tx.contact.create({
        data: {
          workspaceId,
          companyId: company?.id,
          firstName: data.firstName,
          lastName: data.lastName || null,
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          jobTitle: data.jobTitle || null,
          linkedinUrl: data.contactLinkedinUrl || null,
          country: data.contactCountry || null,
          timezone: data.timezone || null,
        }
      });

      const lead = await tx.lead.create({
        data: {
          workspaceId,
          companyId: company?.id,
          contactId: contact.id,
          status: LeadStatus.NEW,
          source: data.source || null,
          sourceUrl: data.sourceUrl || null,
          sourcePlatform: data.sourcePlatform || null,
          originalRequirement: data.originalRequirement || null,
          serviceRequired: data.serviceRequired || null,
          estimatedBudget: data.estimatedBudget || null,
          timeline: data.timeline || null,
          preferredChannel: data.preferredChannel || null,
          email: contact.email,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          website: company?.website,
          linkedinUrl: contact.linkedinUrl,
          priority: data.priority || null,
          positioningMode: data.positioningMode || null,
          assignedTo: data.assignedTo || userId,
        }
      });

      await tx.activity.create({
        data: {
          workspaceId,
          leadId: lead.id,
          type: "LEAD_CREATED",
          description: "Lead manually created",
        }
      });
      
      return lead;
    });
  }

  static async updateLead(workspaceId: string, leadId: string, data: Record<string, unknown>) {
    const updatedLead = await prisma.lead.update({
      where: { id: leadId, workspaceId },
      data,
    });
    
    await prisma.activity.create({
      data: {
        workspaceId,
        leadId,
        type: "LEAD_UPDATED",
        description: "Lead details updated",
      }
    });

    return updatedLead;
  }
}
