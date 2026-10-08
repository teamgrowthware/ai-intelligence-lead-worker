import { MessageService } from "@/services/MessageService";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ConversationsPage({ searchParams }: { searchParams: { search?: string, channel?: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) redirect("/login");
  
  const conversations = await MessageService.getConversations(workspaceId, searchParams.search, searchParams.channel);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Conversations (Phase 6)</h1>
      <form className="mb-4 flex gap-4">
        <input type="text" name="search" placeholder="Search lead..." defaultValue={searchParams.search} className="border p-2 rounded" />
        <select name="channel" defaultValue={searchParams.channel} className="border p-2 rounded">
          <option value="">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
        </select>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">Filter</button>
      </form>
      <div className="space-y-2">
        {conversations.map((c: {id: string; channel: string; updatedAt: Date; lead: {companyId: string | null}; messages: {content: string}[]}) => (
          <Link href={`/conversations/${c.id}`} key={c.id} className="block p-4 border rounded hover:bg-gray-50 flex justify-between">
            <div>
              <div className="font-bold">{c.lead.companyId || 'Unknown Lead'}</div>
              <div className="text-sm text-gray-500">{c.messages[0]?.content || 'No messages'}</div>
            </div>
            <div className="text-right">
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{c.channel}</span>
              <div className="text-xs mt-2 text-gray-400">{new Date(c.updatedAt).toLocaleDateString()}</div>
            </div>
          </Link>
        ))}
        {conversations.length === 0 && <div>No conversations found.</div>}
      </div>
    </div>
  );
}
