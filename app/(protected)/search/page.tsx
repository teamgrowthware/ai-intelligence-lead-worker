import { auth, prisma } from "@/auth";
import Link from "next/link";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const q = searchParams.q || "";
  let leads: {id: string; email: string | null; status: string; leadScore: number | null; company: {name: string | null} | null}[] = [];
  let companies: {id: string; name: string; industry: string | null}[] = [];

  if (q) {
    leads = await prisma.lead.findMany({
      where: { 
        workspaceId,
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { company: { name: { contains: q, mode: 'insensitive' } } }
        ]
      },
      include: { company: true }
    });

    companies = await prisma.company.findMany({
      where: {
        workspaceId,
        name: { contains: q, mode: 'insensitive' }
      }
    });
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Global Search</h1>
      
      <form className="flex gap-4 mb-8" method="GET">
        <input type="text" name="q" defaultValue={q} placeholder="Search leads, companies..." className="border p-2 rounded flex-1" required />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Search</button>
      </form>

      {q && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Leads ({leads.length})</h2>
            <div className="space-y-2">
              {leads.map((l: {id: string; email: string | null; status: string; leadScore: number | null; company: {name: string | null} | null}) => (
                <Link href={`/leads/${l.id}`} key={l.id} className="block p-4 border rounded hover:bg-gray-50">
                  <div className="font-bold">{l.email || 'No email'}</div>
                  <div className="text-sm text-gray-500">{l.company?.name || 'No company'} &bull; Status: {l.status} &bull; Score: {l.leadScore || 0}</div>
                </Link>
              ))}
              {leads.length === 0 && <div className="text-gray-500 text-sm">No leads found.</div>}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Companies ({companies.length})</h2>
            <div className="space-y-2">
              {companies.map((c: {id: string; name: string; industry: string | null}) => (
                <div key={c.id} className="block p-4 border rounded">
                  <div className="font-bold">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.industry || 'No industry'}</div>
                </div>
              ))}
              {companies.length === 0 && <div className="text-gray-500 text-sm">No companies found.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
