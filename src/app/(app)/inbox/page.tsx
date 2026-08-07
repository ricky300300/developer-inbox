import { redirect } from "next/navigation";
import {
  CONVERSATIONS_PAGE_SIZE,
  countConversations,
  listConversations,
} from "@/lib/conversations/queries";
import { getSessionUser } from "@/lib/auth/session";
import { ConversationList } from "@/components/inbox/conversation-list";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; folder?: string; page?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { q, folder: folderParam, page: pageParam } = await searchParams;
  const folder = folderParam === "sent" ? "sent" : "inbox";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * CONVERSATIONS_PAGE_SIZE;

  const [total, conversations] = await Promise.all([
    countConversations({ userId: user.id, folder, query: q }),
    listConversations({
      userId: user.id,
      query: q,
      folder,
      take: CONVERSATIONS_PAGE_SIZE,
      skip,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CONVERSATIONS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // If page is past the end (e.g. after deletes), clamp via redirect
  if (total > 0 && page > totalPages) {
    const params = new URLSearchParams();
    if (folder === "sent") params.set("folder", "sent");
    if (q?.trim()) params.set("q", q.trim());
    params.set("page", String(totalPages));
    redirect(`/inbox?${params.toString()}`);
  }

  return (
    <ConversationList
      conversations={conversations}
      folder={folder}
      query={q}
      page={safePage}
      pageSize={CONVERSATIONS_PAGE_SIZE}
      total={total}
    />
  );
}
