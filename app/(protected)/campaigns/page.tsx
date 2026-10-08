import { prisma, auth } from "@/auth";
import Link from "next/link";
import { CampaignService } from "@/services/CampaignService";
import { revalidatePath } from "next/cache";

export default async function CampaignsPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId },
    include: { _count: { select: { recipients: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <form action={async () => {
          "use server"
          const session = await auth();
          const wid = (session?.user as unknown as { workspaceId: string })?.workspaceId;
          await prisma.campaign.create({
            data: { workspaceId: wid, name: "New Campaign " + Date.now(), status: "DRAFT" }
          });
          revalidatePath("/campaigns");
        }}>
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">New Campaign</button>
        </form>
      </div>
      
      <div className="space-y-4">
        {campaigns.map((camp: {id: string; name: string; status: string; _count: {recipients: number}}) => (
          <div key={camp.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{camp.name}</div>
              <div className="text-sm text-gray-500">Recipients: {camp._count.recipients} | Status: {camp.status}</div>
            </div>
            <div className="flex gap-2">
              {camp.status === 'DRAFT' && (
                <form action={async () => {
                  "use server"
                  const session = await auth();
                  const wid = (session?.user as unknown as { workspaceId: string })?.workspaceId;
                  await CampaignService.startCampaign(wid, camp.id);
                  revalidatePath("/campaigns");
                }}>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Start</button>
                </form>
              )}
            </div>
          </div>
        ))}
        {campaigns.length === 0 && <div className="text-gray-500 text-center py-8 border rounded">No campaigns found.</div>}
      </div>
    </div>
  );
}
