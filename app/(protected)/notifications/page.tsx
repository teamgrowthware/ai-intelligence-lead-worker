import { auth, prisma } from "@/auth";
import { NotificationService } from "@/services/NotificationService";
import { revalidatePath } from "next/cache";

export default async function NotificationsPage() {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) return <div>Unauthorized</div>;

  const notifications = await prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <form action={async () => {
          "use server"
          const session = await auth();
          const wid = (session?.user as unknown as { workspaceId: string })?.workspaceId;
          await prisma.notification.updateMany({ where: { workspaceId: wid }, data: { read: true } });
          revalidatePath("/notifications");
        }}>
          <button type="submit" className="text-sm bg-gray-200 px-3 py-1 rounded">Mark all as read</button>
        </form>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 border rounded ${n.read ? 'bg-white opacity-70' : 'bg-blue-50 font-medium'}`}>
            <div className="flex justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{n.type}</span>
                <p className="mt-1">{n.message}</p>
              </div>
              {!n.read && (
                <form action={async () => {
                  "use server"
                  const session = await auth();
                  const wid = (session?.user as unknown as { workspaceId: string })?.workspaceId;
                  await NotificationService.markAsRead(wid, n.id);
                  revalidatePath("/notifications");
                }}>
                  <button type="submit" className="text-xs text-blue-600 hover:underline">Mark read</button>
                </form>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
        {notifications.length === 0 && <div className="text-center py-8 text-gray-500">No notifications.</div>}
      </div>
    </div>
  );
}
