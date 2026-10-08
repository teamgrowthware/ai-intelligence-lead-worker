import { auth, prisma } from "@/auth";
import { LeadDiscoveryService } from "@/services/LeadDiscoveryService";
import { revalidatePath } from "next/cache";

export default async function LeadDiscoveryPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const industry = searchParams.q || "";
  let results: {companyName: string; email: string; industry: string}[] = [];
  if (industry) {
    results = await LeadDiscoveryService.discoverLeads(workspaceId, industry);
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Lead Discovery</h1>
      
      <form className="flex gap-4 mb-8" method="GET">
        <input type="text" name="q" defaultValue={industry} placeholder="Industry (e.g. Technology)" className="border p-2 rounded flex-1" required />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Discover Leads</button>
      </form>

      <div className="space-y-4">
        {results.map((r, i) => (
          <div key={i} className="border p-4 rounded flex justify-between items-center">
            <div>
              <div className="font-bold">{r.companyName}</div>
              <div className="text-sm text-gray-500">{r.email} - {r.industry}</div>
            </div>
            <form action={async () => {
              "use server"
              const session = await auth();
              const wid = (session?.user as unknown as { workspaceId: string })?.workspaceId;
              try {
                await LeadDiscoveryService.importLead(wid, { companyName: r.companyName, email: r.email, industry: r.industry });
                // Do something on success, revalidate doesn't clear the results array since it's url-based, just an example
              } catch(e) { }
            }}>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Import</button>
            </form>
          </div>
        ))}
        {industry && results.length === 0 && <div>No leads found for this criteria.</div>}
      </div>
    </div>
  );
}
