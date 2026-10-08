import { prisma } from "@/auth";

export class ExportService {
  static async exportLeadsToCsv(workspaceId: string): Promise<string> {
    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      include: { company: true }
    });

    const headers = ["ID", "Status", "Email", "Company", "Score", "Created At"];
    const rows = leads.map(l => [
      l.id,
      l.status,
      l.email || "",
      l.company?.name || "",
      l.leadScore?.toString() || "",
      l.createdAt.toISOString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    return csvContent;
  }
}
