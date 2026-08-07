import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listConversations } from "@/lib/conversations/queries";
import {
  getActiveConnectionForUser,
  getFromAddress,
  toDecryptedConfig,
} from "@/lib/conversations/reply";
import { ConversationList } from "@/components/inbox/conversation-list";
import { NewEmailComposer } from "@/components/inbox/new-email-composer";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { q } = await searchParams;
  const [conversations, connection] = await Promise.all([
    listConversations({ userId: user.id, query: q }),
    getActiveConnectionForUser(user.id),
  ]);

  let fromEmail: string | undefined;
  if (connection) {
    try {
      fromEmail = getFromAddress(toDecryptedConfig(connection));
    } catch {
      fromEmail = undefined;
    }
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(260px,320px)_1fr]">
      <div className="hidden min-h-0 md:block">
        <ConversationList conversations={conversations} query={q} />
      </div>
      <NewEmailComposer fromEmail={fromEmail} />
    </div>
  );
}
