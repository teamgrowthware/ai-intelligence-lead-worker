import { auth, prisma } from "@/auth";
import { revalidatePath } from "next/cache";

export default async function IntegrationsPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const integrations = await prisma.integration.findMany({
    where: { workspaceId }
  });

  const providers = [
    { type: "MOCK_AI", name: "Mock AI Provider", description: "Internal provider for generating proposals and intelligence." },
    { type: "MOCK_WHATSAPP", name: "WhatsApp Cloud API (Mock)", description: "Simulates sending and receiving WhatsApp messages." },
    { type: "MOCK_EMAIL", name: "SMTP Email (Mock)", description: "Simulates email outreach." },
    { type: "MOCK_DISCOVERY", name: "Lead Discovery Engine", description: "Synthetic lead discovery." },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>

      <div className="space-y-4">
        {providers.map(p => {
          const active = integrations.find(i => i.providerType === p.type && i.isActive);
          return (
            <div key={p.type} className="bg-white border rounded p-6 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">{p.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{p.description}</p>
              </div>
              <div>
                {active ? (
                  <form action={async () => {
                    "use server"
                    const s = await auth();
                    const wid = (s?.user as unknown as { workspaceId: string })?.workspaceId;
                    await prisma.integration.deleteMany({ where: { workspaceId: wid, providerType: p.type } });
                    revalidatePath("/integrations");
                  }}>
                    <button type="submit" className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded text-sm font-bold">Disable</button>
                  </form>
                ) : (
                  <form action={async () => {
                    "use server"
                    const s = await auth();
                    const wid = (s?.user as unknown as { workspaceId: string })?.workspaceId;
                    await prisma.integration.create({ data: { workspaceId: wid, providerType: p.type, isActive: true } });
                    revalidatePath("/integrations");
                  }}>
                    <button type="submit" className="bg-black text-white px-4 py-2 rounded text-sm font-bold">Enable</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
