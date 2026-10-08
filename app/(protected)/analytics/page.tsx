import { auth } from "@/auth";
import { AnalyticsService } from "@/services/AnalyticsService";

export default async function AnalyticsPage({ searchParams }: { searchParams: { days?: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const days = parseInt(searchParams.days || "30", 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const metrics = await AnalyticsService.getWorkspaceAnalytics(workspaceId);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="text-sm">
          Last <a href="?days=7" className="text-blue-600 underline px-2">7 Days</a> | 
          <a href="?days=30" className="text-blue-600 underline px-2">30 Days</a> |
          <a href="?days=90" className="text-blue-600 underline px-2">90 Days</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border p-6 rounded bg-white shadow-sm">
          <h2 className="font-bold mb-4 border-b pb-2">Lead Funnel</h2>
          <div className="flex justify-between py-1"><span>Total Leads</span><span className="font-bold">{metrics.funnel.total}</span></div>
          <div className="flex justify-between py-1"><span>Discovered</span><span className="font-bold">{metrics.funnel.discovered}</span></div>
          <div className="flex justify-between py-1"><span>Qualified</span><span className="font-bold">{metrics.funnel.qualified}</span></div>
          <div className="flex justify-between py-1 text-green-600"><span>Won</span><span className="font-bold">{metrics.funnel.won}</span></div>
        </div>

        <div className="border p-6 rounded bg-white shadow-sm">
          <h2 className="font-bold mb-4 border-b pb-2">Outreach</h2>
          <div className="flex justify-between py-1"><span>Sent Messages</span><span className="font-bold">{metrics.outreach.sent}</span></div>
          <div className="flex justify-between py-1"><span>Replies Received</span><span className="font-bold">{metrics.outreach.replied}</span></div>
          <div className="flex justify-between py-1 text-blue-600"><span>Response Rate</span><span className="font-bold">{metrics.outreach.responseRate}</span></div>
        </div>

        <div className="border p-6 rounded bg-white shadow-sm">
          <h2 className="font-bold mb-4 border-b pb-2">Proposals</h2>
          <div className="flex justify-between py-1"><span>Generated</span><span className="font-bold">{metrics.proposals.generated}</span></div>
          <div className="flex justify-between py-1 text-green-600"><span>Approved</span><span className="font-bold">{metrics.proposals.approved}</span></div>
        </div>

        <div className="border p-6 rounded bg-white shadow-sm">
          <h2 className="font-bold mb-4 border-b pb-2">Campaigns</h2>
          <div className="flex justify-between py-1"><span>Active Campaigns</span><span className="font-bold">{metrics.campaigns.total}</span></div>
          <div className="flex justify-between py-1"><span>Recipients Queued/Sent</span><span className="font-bold">{metrics.campaigns.recipients}</span></div>
        </div>

        <div className="border p-6 rounded bg-white shadow-sm">
          <h2 className="font-bold mb-4 border-b pb-2">Follow-ups</h2>
          <div className="flex justify-between py-1 text-orange-600"><span>Due / Overdue</span><span className="font-bold">{metrics.followups.due}</span></div>
          <div className="flex justify-between py-1 text-green-600"><span>Completed</span><span className="font-bold">{metrics.followups.completed}</span></div>
        </div>

        <div className="border p-6 rounded bg-white shadow-sm">
          <h2 className="font-bold mb-4 border-b pb-2">Lead Scoring</h2>
          <div className="flex justify-between py-1"><span>Average Score</span><span className="font-bold">{metrics.scoring.avgScore}</span></div>
        </div>
      </div>
    </div>
  );
}
