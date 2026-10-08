import { auth, prisma } from "@/auth";

export default async function TeamPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const users = await prisma.user.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button className="bg-black text-white px-4 py-2 rounded text-sm">Invite User</button>
      </div>

      <div className="bg-white border rounded">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-sm text-gray-700">Name</th>
              <th className="p-4 font-bold text-sm text-gray-700">Email</th>
              <th className="p-4 font-bold text-sm text-gray-700">Role</th>
              <th className="p-4 font-bold text-sm text-gray-700">Joined</th>
              <th className="p-4 font-bold text-sm text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">{u.name || "Unknown"}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{u.role}</span>
                </td>
                <td className="p-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 text-sm hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
