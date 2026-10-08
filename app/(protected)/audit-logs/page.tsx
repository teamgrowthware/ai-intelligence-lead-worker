import { auth, prisma } from "@/auth";

export default async function AuditLogsPage({ searchParams }: { searchParams: { action?: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const actionFilter = searchParams.action || "";

  const logs = await prisma.auditLog.findMany({
    where: { 
      workspaceId,
      ...(actionFilter ? { action: actionFilter } : {})
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <form method="GET" className="flex gap-2">
          <input type="text" name="action" defaultValue={actionFilter} placeholder="Filter by action..." className="border p-2 rounded text-sm" />
          <button type="submit" className="bg-gray-200 px-4 py-2 rounded text-sm font-bold">Filter</button>
        </form>
      </div>

      <div className="bg-white border rounded">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-sm text-gray-700">Timestamp</th>
              <th className="p-4 font-bold text-sm text-gray-700">Action</th>
              <th className="p-4 font-bold text-sm text-gray-700">Entity Type</th>
              <th className="p-4 font-bold text-sm text-gray-700">Entity ID</th>
              <th className="p-4 font-bold text-sm text-gray-700">User ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{log.action}</span></td>
                <td className="p-4 text-sm">{log.entityType}</td>
                <td className="p-4 text-xs font-mono text-gray-500">{log.entityId}</td>
                <td className="p-4 text-sm">{log.userId || "System"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
