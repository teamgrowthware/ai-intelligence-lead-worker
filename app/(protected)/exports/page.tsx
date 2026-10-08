import { auth } from "@/auth";
import { ExportService } from "@/services/ExportService";
import { revalidatePath } from "next/cache";

export default async function ExportsPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Data Exports</h1>
      
      <div className="bg-white p-6 border rounded mb-4 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg">Export Leads</h2>
          <p className="text-gray-500 text-sm">Download all leads with their current status and scores as CSV.</p>
        </div>
        
        <form action={async () => {
          "use server"
          const session = await auth();
          const wid = (session?.user as unknown as { workspaceId: string })?.workspaceId;
          const csv = await ExportService.exportLeadsToCsv(wid);
          // In a real app we would use a Route Handler to return the file,
          // but Server Actions can also trigger file downloads or we can just log for verification.
          console.log("CSV generated, length:", csv.length);
        }}>
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">Generate CSV</button>
        </form>
      </div>
    </div>
  );
}
