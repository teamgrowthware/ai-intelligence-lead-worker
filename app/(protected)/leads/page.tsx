import { prisma } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@prisma/client";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth();
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);
  const resolvedSearchParams = await searchParams;

  const search = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;

  const whereClause: Prisma.LeadWhereInput = { workspaceId };
  if (search) {
    whereClause.OR = [
      { contact: { firstName: { contains: search, mode: "insensitive" } } },
      { contact: { lastName: { contains: search, mode: "insensitive" } } },
      { company: { name: { contains: search, mode: "insensitive" } } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    include: {
      contact: true,
      company: true,
      assignee: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalLeads = await prisma.lead.count({ where: whereClause });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Manage and track your leads ({totalLeads} total)</p>
        </div>
        <Link href="/leads/new">
          <Button>Add Lead</Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <form className="flex w-full max-w-sm items-center space-x-2">
          <Input type="text" name="q" placeholder="Search leads..." defaultValue={search} />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
                      {lead.contact?.firstName} {lead.contact?.lastName}
                    </Link>
                  </TableCell>
                  <TableCell>{lead.company?.name || "-"}</TableCell>
                  <TableCell>{lead.serviceRequired || "-"}</TableCell>
                  <TableCell>{lead.source || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.status}</Badge>
                  </TableCell>
                  <TableCell>{lead.priority || "-"}</TableCell>
                  <TableCell>{lead.leadScore || "-"}</TableCell>
                  <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
