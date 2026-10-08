import { auth, prisma } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>

      <div className="bg-white border rounded p-6 mb-6">
        <h2 className="font-bold mb-4">General Settings</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Workspace Name</label>
            <input type="text" defaultValue={workspace?.name} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Company Website</label>
            <input type="text" placeholder="https://..." className="w-full border p-2 rounded" />
          </div>
          <button type="button" className="bg-black text-white px-4 py-2 rounded text-sm">Save Changes</button>
        </form>
      </div>

      <div className="bg-white border rounded p-6 border-red-200">
        <h2 className="font-bold mb-4 text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">Deleting your workspace is irreversible. All data will be permanently removed.</p>
        <button type="button" className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold">Delete Workspace</button>
      </div>
    </div>
  );
}
