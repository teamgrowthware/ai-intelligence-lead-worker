import { NextRequest, NextResponse } from "next/server";
import { JobService } from "@/services/JobService";

export const maxDuration = 60; // Max execution time 60s
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // In a real application, you'd secure this endpoint with a secret key
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "internal_cron_secret"}`) {
    // For development ease, we allow bypassing if env isn't strictly set, but block if it doesn't match
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Process next batch of jobs (limit 20)
    await JobService.processNextJobs(20);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
