import { FollowupTaskService } from "@/services/FollowupTaskService";
import { auth } from "@/auth";
import { completeTaskAction, cancelTaskAction } from "./actions";

export default async function FollowUpsPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;
  
  const tasks = await FollowupTaskService.getTasks(workspaceId);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Follow-up Automation</h1>
      
      <div className="bg-white rounded border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Lead</th>
              <th className="p-3">Rule</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b">
                <td className="p-3 font-medium">{task.lead.companyId || 'Unknown'}</td>
                <td className="p-3">{task.rule.actionType}</td>
                <td className="p-3">{new Date(task.dueAt).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : task.status === 'EXECUTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  {task.status === 'PENDING' && (
                    <>
                      <form action={async () => { "use server"; await completeTaskAction(task.id); }}><button className="text-blue-600 hover:underline">Complete</button></form>
                      <form action={async () => { "use server"; await cancelTaskAction(task.id); }}><button className="text-red-600 hover:underline">Cancel</button></form>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No follow-up tasks scheduled.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
