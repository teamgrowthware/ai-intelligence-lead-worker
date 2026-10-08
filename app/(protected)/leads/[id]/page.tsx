import { auth, prisma } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadAction } from "../actions";
import { addLeadNoteAction, generateLeadIntelligenceAction, generateProposalStrategyAction, generatePortfolioMatchesAction } from "./actions";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth();
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);
  const resolvedParams = await params;
  
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id, workspaceId },
    include: {
      contact: true,
      company: true,
      assignee: true,
      intelligence: true,
      strategies: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      activities: {
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!lead) {
    notFound();
  }

  // Bind actions
  const updateLeadWithId = updateLeadAction.bind(null, lead.id);
  const addNoteWithId = addLeadNoteAction.bind(null, lead.id);
  const genIntelWithId = generateLeadIntelligenceAction.bind(null, lead.id);
  const genStrategyWithId = generateProposalStrategyAction.bind(null, lead.id);

  const activeStrategy = lead.strategies[0];
  let portfolioMatchesParsed: { id: string, title: string, score: number, reasons: string[] }[] = [];
  if (activeStrategy?.portfolioMatches) {
    try { portfolioMatchesParsed = JSON.parse(activeStrategy.portfolioMatches); } catch{}
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20">
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lead.contact?.firstName} {lead.contact?.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">{lead.company?.name || lead.email}</p>
        </div>
        <div className="ml-auto">
          <Badge variant="secondary" className="text-sm">{lead.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{lead.email || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{lead.phone || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Service Required</Label>
                <p className="font-medium">{lead.serviceRequired || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Budget</Label>
                <p className="font-medium">{lead.estimatedBudget || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground">Original Requirement</Label>
                <p className="font-medium whitespace-pre-wrap">{lead.originalRequirement || "-"}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Intelligence Section */}
          <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-indigo-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" /> 
                  AI Lead Intelligence
                </CardTitle>
                {lead.intelligence && (
                  <p className="text-xs text-muted-foreground mt-1">Generated: {new Date(lead.intelligence.createdAt).toLocaleString()}</p>
                )}
              </div>
              <form action={genIntelWithId}>
                <Button variant={lead.intelligence ? "outline" : "default"} size="sm">
                  {lead.intelligence ? "Regenerate Intelligence" : "Generate Intelligence"}
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              {!lead.intelligence ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No intelligence generated yet. Click generate to analyze this lead.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 mt-4 relative z-10">
                  <div className="sm:col-span-2">
                    <Label className="text-indigo-600/80 font-semibold text-xs uppercase tracking-wider">AI Summary</Label>
                    <p className="text-sm mt-1">{lead.intelligence.reasoning}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600/80 font-semibold text-xs uppercase tracking-wider">Buying Intent</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{lead.intelligence.intentScore}%</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-indigo-600/80 font-semibold text-xs uppercase tracking-wider">Budget Signal</Label>
                    <p className="text-sm mt-1">{lead.intelligence.budgetSignal || "Unknown"}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600/80 font-semibold text-xs uppercase tracking-wider">Detected Services</Label>
                    <p className="text-sm mt-1">{lead.intelligence.detectedServices.join(", ") || "None"}</p>
                  </div>
                  <div>
                    <Label className="text-indigo-600/80 font-semibold text-xs uppercase tracking-wider">Pain Points</Label>
                    <p className="text-sm mt-1">{lead.intelligence.painPoints.join(", ") || "None identified"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-indigo-600/80 font-semibold text-xs uppercase tracking-wider">Requirement Understanding</Label>
                    <p className="text-sm mt-1">{lead.intelligence.normalizedRequirement}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proposal Strategy Section */}
          {lead.intelligence && (
            <Card className="border-emerald-100 dark:border-emerald-900/50 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" /> 
                  Proposal Strategy
                </CardTitle>
                <form action={genStrategyWithId}>
                  <Button variant={activeStrategy ? "outline" : "default"} size="sm">
                    {activeStrategy ? "Regenerate Strategy" : "Generate Strategy"}
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                {!activeStrategy ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Generate a strategy based on the AI Intelligence.
                  </div>
                ) : (
                  <div className="space-y-6 relative z-10 mt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Recommended Positioning</Label>
                        <p className="text-sm mt-1">{activeStrategy.positioningMode || "Hybrid"}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Recommended Tone</Label>
                        <p className="text-sm mt-1">{activeStrategy.tone}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Value Proposition</Label>
                        <p className="text-sm mt-1">{activeStrategy.recommendedValueProposition}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Opening Angle</Label>
                        <p className="text-sm mt-1">{activeStrategy.proposalAngle}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Pricing Strategy</Label>
                        <p className="text-sm mt-1">{activeStrategy.pricingStrategy}</p>
                      </div>
                      <div>
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Urgency Strategy</Label>
                        <p className="text-sm mt-1">{activeStrategy.urgencyStrategy}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Objection Strategy</Label>
                        <p className="text-sm mt-1">{activeStrategy.objectionStrategy}</p>
                      </div>
                    </div>

                    {/* Portfolio Matches */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-emerald-600/80 font-semibold text-xs uppercase tracking-wider">Recommended Portfolio</Label>
                        <form action={generatePortfolioMatchesAction.bind(null, lead.id, activeStrategy.id)}>
                          <Button variant="secondary" size="sm">Find Matches</Button>
                        </form>
                      </div>
                      
                      {portfolioMatchesParsed.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No matches found or generated yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {portfolioMatchesParsed.map(match => (
                            <div key={match.id} className="p-3 bg-muted/50 rounded-lg border text-sm">
                              <div className="flex justify-between font-semibold">
                                <span>{match.title}</span>
                                <Badge variant="secondary">Score: {match.score}</Badge>
                              </div>
                              <ul className="list-disc pl-4 mt-2 text-xs text-muted-foreground">
                                {match.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={addNoteWithId} className="flex gap-2 mb-6">
                <Textarea name="note" placeholder="Add a note..." className="min-h-[80px]" required />
                <Button type="submit" className="self-end">Add Note</Button>
              </form>

              <div className="space-y-4 border-l-2 border-muted pl-4 ml-2">
                {lead.activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activities yet.</p>
                ) : (
                  lead.activities.map((activity) => (
                    <div key={activity.id} className="relative">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[23px] top-1.5 ring-4 ring-background" />
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium">{activity.type}</span>
                        <span className="text-sm text-muted-foreground">{activity.description}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={updateLeadWithId} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select 
                    id="status" 
                    name="status"
                    defaultValue={lead.status}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="NEW">New</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL_DRAFTED">Proposal Drafted</option>
                    <option value="AWAITING_APPROVAL">Awaiting Approval</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                    <option value="INTERESTED">Interested</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select 
                    id="priority" 
                    name="priority"
                    defaultValue={lead.priority || ""}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">None</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Update Lead</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
