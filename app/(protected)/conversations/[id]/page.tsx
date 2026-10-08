import { auth, prisma } from "@/auth";
import { sendDraftAction, retryMessageAction, simulateInboundAction } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ConversationDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const workspaceId = (session?.user as unknown as { workspaceId: string })?.workspaceId;
  if (!workspaceId) redirect("/login");
  
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id, lead: { workspaceId } },
    include: { lead: true, messages: { orderBy: { createdAt: 'asc' }, include: { intelligence: true } } }
  });
  if (!conversation) return <div>Not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/conversations" className="text-blue-500 mb-4 inline-block">&larr; Back to Conversations</Link>
      <h1 className="text-2xl font-bold mb-4">Conversation with {conversation.lead.companyId || 'Lead'} ({conversation.channel})</h1>
      
      <div className="border rounded p-4 h-96 overflow-y-auto mb-4 space-y-4">
        {conversation.messages.map((msg: {id: string; direction: string; status: string | null; content: string; createdAt: Date; intelligence: {intent: string | null; sentiment: string | null; recommendedNextAction: string | null; suggestedReply: string | null;} | null}) => (
          <div key={msg.id} className={`p-4 rounded max-w-[80%] ${msg.direction === 'OUTBOUND' ? 'bg-blue-50 ml-auto' : 'bg-gray-50 border'}`}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold">{msg.direction === 'OUTBOUND' ? 'You' : 'Lead'}</span>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded shadow-sm">{msg.status}</span>
            </div>
            <div className="text-gray-800">{msg.content}</div>
            
            {msg.intelligence && (
              <div className="mt-3 bg-white p-2 rounded border border-gray-200 text-xs">
                <div className="font-semibold mb-1 text-purple-700">AI Reply Intelligence</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div><strong>Intent:</strong> {msg.intelligence.intent}</div>
                  <div><strong>Sentiment:</strong> {msg.intelligence.sentiment}</div>
                  <div><strong>Next Action:</strong> {msg.intelligence.recommendedNextAction}</div>
                </div>
                <div className="bg-gray-100 p-2 rounded text-gray-700 italic">
                  <strong>Suggested Reply:</strong> {msg.intelligence.suggestedReply}
                </div>
                <form action={async () => {
                  "use server"
                  await sendDraftAction(params.id, conversation.leadId, conversation.channel, msg.intelligence?.suggestedReply || "");
                }}>
                  <button type="submit" className="mt-2 text-blue-600 font-medium hover:underline">Use Suggested Reply</button>
                </form>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2 flex justify-between">
              <span>{new Date(msg.createdAt).toLocaleString()}</span>
              {msg.status === 'FAILED' && (
                <form action={async () => {
                  "use server"
                  await retryMessageAction(params.id, msg.id);
                }}>
                  <button type="submit" className="text-red-500 underline">Retry</button>
                </form>
              )}
            </div>
          </div>
        ))}
        {conversation.messages.length === 0 && <div className="text-gray-500 text-center py-8">No messages yet.</div>}
      </div>

      <div className="flex gap-4 mb-4">
        <form action={async (formData) => {
          "use server"
          const content = formData.get("content") as string;
          if (content) await sendDraftAction(params.id, conversation.leadId, conversation.channel, content);
        }} className="flex gap-2 flex-1">
          <input type="text" name="content" className="flex-1 border rounded p-2" placeholder="Send outbound message..." required />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Send Outbound</button>
        </form>

        <form action={async (formData) => {
          "use server"
          const content = formData.get("content") as string;
          if (content) await simulateInboundAction(params.id, content);
        }} className="flex gap-2 flex-1">
          <input type="text" name="content" className="flex-1 border rounded p-2 bg-gray-50" placeholder="Simulate inbound reply..." required />
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded">Simulate Inbound</button>
        </form>
      </div>
    </div>
  );
}
