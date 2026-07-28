import { listConversations } from "@/lib/conversations/queries";
import { getSessionUser } from "@/lib/auth/session";
import { ConversationList } from "@/components/inbox/conversation-list";
import { redirect } from "next/navigation";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const conversations = await listConversations({
    userId: user.id,
    query: q,
  });

  return (
    <div className="grid h-[100dvh] grid-cols-1 md:grid-cols-[320px_1fr]">
      <ConversationList
        conversations={conversations}
        query={q}
      />
      <div className="hidden items-center justify-center md:flex">
        <div className="max-w-sm px-6 text-center">
          <p className="text-sm font-medium">Select a conversation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a thread from the list to read and reply.
          </p>
        </div>
      </div>
    </div>
  );
}
