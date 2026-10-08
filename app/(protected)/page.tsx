import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { auth } from "@/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    proposalsPending,
    proposalsSent,
    interestedLeads,
    wonLeads,
    lostLeads,
    recentLeads,
    recentActivities
  ] = await Promise.all([
    prisma.lead.count({ where: { workspaceId } }),
    prisma.lead.count({ where: { workspaceId, status: "NEW" } }),
    prisma.lead.count({ where: { workspaceId, status: "QUALIFIED" } }),
    prisma.lead.count({ where: { workspaceId, status: "AWAITING_APPROVAL" } }),
    prisma.lead.count({ where: { workspaceId, status: "PROPOSAL_SENT" } }),
    prisma.lead.count({ where: { workspaceId, status: "INTERESTED" } }),
    prisma.lead.count({ where: { workspaceId, status: "WON" } }),
    prisma.lead.count({ where: { workspaceId, status: "LOST" } }),
    prisma.lead.findMany({ 
      where: { workspaceId }, 
      orderBy: { createdAt: "desc" }, 
      take: 5,
      include: { contact: true, company: true }
    }),
    prisma.activity.findMany({ 
      where: { workspaceId }, 
      orderBy: { createdAt: "desc" }, 
      take: 5,
      include: { lead: { include: { contact: true } } }
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualifiedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalsPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalsSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interested Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interestedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lostLeads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leads found.</p>
              ) : (
                recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium leading-none">
                        <Link href={`/leads/${lead.id}`} className="hover:underline">
                          {lead.contact?.firstName} {lead.contact?.lastName}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">{lead.company?.name || lead.email}</p>
                    </div>
                    <Badge variant="outline">{lead.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activities found.</p>
              ) : (
                recentActivities.map(activity => (
                  <div key={activity.id} className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.lead?.contact?.firstName} {activity.lead?.contact?.lastName} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
