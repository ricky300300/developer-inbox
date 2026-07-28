import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  getConversationForUser,
  listConversations,
} from "@/lib/conversations/queries";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ConversationThread } from "@/components/conversation/thread";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { q } = await searchParams;

  const [conversations, conversation] = await Promise.all([
    listConversations({ userId: user.id, query: q }),
    getConversationForUser({ userId: user.id, conversationId: id }),
  ]);

  if (!conversation) notFound();

  return (
    <div className="grid h-[100dvh] grid-cols-1 md:grid-cols-[320px_1fr]">
      <div className="hidden md:block">
        <ConversationList
          conversations={conversations}
          activeId={conversation.id}
          query={q}
        />
      </div>
      <ConversationThread
        conversationId={conversation.id}
        subject={conversation.subject}
        participants={conversation.participants}
        messages={conversation.messages}
      />
    </div>
  );
}
