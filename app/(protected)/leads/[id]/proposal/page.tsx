import { auth } from "@/auth";
import { getCurrentWorkspace } from "@/lib/workspace";
import { prisma } from "@/auth";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProposalEditor } from "./ProposalEditor";
import { generateProposalAction, runCriticAction, approveProposalAction } from "./actions";

export default async function ProposalStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !session.user) return notFound();
  
  const workspaceId = getCurrentWorkspace(session as unknown as Parameters<typeof getCurrentWorkspace>[0]);

  const lead = await prisma.lead.findUnique({
    where: { id, workspaceId },
    include: {
      intelligence: true,
      strategies: { orderBy: { createdAt: 'desc' }, take: 1 },
      proposals: { orderBy: { versionNumber: 'desc' }, take: 1 }
    }
  });

  if (!lead) return notFound();

  const intel = lead.intelligence;
  const strategy = lead.strategies[0];
  const activeProposal = lead.proposals[0];

  if (!intel || !strategy) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Proposal Studio</h1>
        <Card>
          <CardContent className="pt-6">
            <p>Please generate Lead Intelligence and Proposal Strategy first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse portfolio matches to show selected/available
  let portfolioMatches: { id: string, title: string }[] = [];
  try {
    if (strategy.portfolioMatches) {
      portfolioMatches = JSON.parse(strategy.portfolioMatches);
    }
  } catch(error) {}

  let criticData: Record<string, unknown> | null = null;
  if (activeProposal?.criticFeedback) {
    try {
      criticData = JSON.parse(activeProposal.criticFeedback);
    } catch(error) {}
  }

  return (
    <div className="grid grid-cols-12 gap-6 p-6 h-[calc(100vh-64px)] overflow-hidden">
      
      {/* LEFT COLUMN: Context */}
      <div className="col-span-3 overflow-y-auto space-y-6 pb-20">
        <h2 className="text-xl font-bold">Context</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lead Requirement</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {intel.normalizedRequirement || lead.originalRequirement}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Strategy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><strong>Positioning:</strong> {strategy.positioningMode}</div>
            <div><strong>Tone:</strong> {strategy.tone}</div>
            <div><strong>Pricing:</strong> {strategy.pricingStrategy}</div>
          </CardContent>
        </Card>
      </div>

      {/* CENTER COLUMN: Editor */}
      <div className="col-span-6 overflow-y-auto pb-20 border-l border-r px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Proposal Editor</h2>
          {activeProposal && (
            <Badge variant={activeProposal.status === 'APPROVED' ? 'default' : 'secondary'}>
              {activeProposal.status.replace("_", " ")}
            </Badge>
          )}
        </div>

        {activeProposal ? (
          <ProposalEditor 
            proposalId={activeProposal.id} 
            leadId={lead.id} 
            initialContent={activeProposal.content} 
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground mb-4">No proposal generated yet.</p>
              <form action={async () => {
                "use server";
                await generateProposalAction(lead.id, strategy.id, portfolioMatches.map(m => m.id), "AGENCY", "MEDIUM");
              }}>
                <Button type="submit">Generate First Draft</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT COLUMN: Critic & Actions */}
      <div className="col-span-3 overflow-y-auto space-y-6 pb-20">
        <h2 className="text-xl font-bold">Critic & Actions</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProposal && (
              <form action={async () => {
                "use server";
                await generateProposalAction(lead.id, strategy.id, portfolioMatches.map(m => m.id), "AGENCY", "MEDIUM");
              }}>
                <Button variant="outline" className="w-full">Regenerate Proposal</Button>
              </form>
            )}

            {activeProposal && (
              <form action={async () => {
                "use server";
                await runCriticAction(lead.id, activeProposal.id);
              }}>
                <Button variant="secondary" className="w-full">Run Critic</Button>
              </form>
            )}

            {activeProposal && activeProposal.status !== 'APPROVED' && (
              <form action={async () => {
                "use server";
                await approveProposalAction(lead.id, activeProposal.id);
              }}>
                <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">Approve Proposal</Button>
              </form>
            )}
          </CardContent>
        </Card>

        {criticData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex justify-between">
                <span>Critic Score</span>
                <Badge variant={criticData.final_decision === 'PASS' ? 'default' : 'destructive'}>
                  {String(criticData.final_decision)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <div className="text-3xl font-bold text-center mb-2">{String(criticData.overall_score)}/100</div>
              </div>
              
              {criticData.hallucination_risk === 'HIGH' && (
                <div className="bg-red-100 text-red-800 p-2 rounded text-xs font-semibold">
                  ⚠️ High Hallucination Risk Detected!
                </div>
              )}

              {Array.isArray(criticData.improvement_suggestions) && criticData.improvement_suggestions.length > 0 && (
                <div>
                  <h4 className="font-bold mb-1">Suggestions:</h4>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
                    {criticData.improvement_suggestions.map((s: unknown, i: number) => <li key={i}>{String(s)}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
