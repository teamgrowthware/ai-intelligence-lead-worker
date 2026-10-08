import { NextRequest, NextResponse } from "next/server";
import { ExportService } from "@/services/ExportService";

export async function GET(req: NextRequest) {
  // In a real app we'd get workspaceId from auth session
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const type = req.nextUrl.searchParams.get("type");

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  let csvContent = "";
  let filename = "export.csv";

  try {
    if (type === "leads") {
      csvContent = await ExportService.exportLeadsToCsv(workspaceId);
      filename = "leads_export.csv";
    } else {
      return NextResponse.json({ error: "Unsupported export type" }, { status: 400 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);

    return new NextResponse(csvContent, { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
