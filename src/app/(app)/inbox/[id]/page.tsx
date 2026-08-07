import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  getConversationForUser,
  markConversationRead,
} from "@/lib/conversations/queries";
import { ConversationThread } from "@/components/conversation/thread";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ folder?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { folder } = await searchParams;

  const conversation = await getConversationForUser({
    userId: user.id,
    conversationId: id,
  });

  if (!conversation) notFound();

  if (conversation.unread) {
    const userId = user.id;
    const conversationId = conversation.id;
    after(async () => {
      await markConversationRead({ userId, conversationId });
      revalidatePath("/inbox");
    });
  }

  const backHref = folder === "sent" ? "/inbox?folder=sent" : "/inbox";

  return (
    <ConversationThread
      conversationId={conversation.id}
      subject={conversation.subject}
      participants={conversation.participants}
      messages={conversation.messages}
      backHref={backHref}
    />
  );
}
