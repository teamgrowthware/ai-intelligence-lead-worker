import { NextRequest, NextResponse } from "next/server";
import { GlobalSearchService } from "@/services/GlobalSearchService";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  const query = req.nextUrl.searchParams.get("q");

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ leads: [], campaigns: [], messages: [] });
  }

  try {
    const results = await GlobalSearchService.search(workspaceId, query);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
