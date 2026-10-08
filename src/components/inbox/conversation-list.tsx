"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Paperclip,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  displayNameFromAddress,
  formatMailListDate,
} from "@/lib/email/display";
import type { ConversationFolder } from "@/lib/conversations/queries";

async function patchConversations(action: "trash" | "restore", ids: string[]) {
  const res = await fetch("/api/conversations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ids }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    updated?: number;
  };
  if (!res.ok || !data.updated) {
    throw new Error(data.error ?? "Couldn't update Trash");
  }
  return data.updated;
}

export type ConversationListItem = {
  id: string;
  subject: string;
  participants: string;
  unread: boolean;
  lastMessageAt: string | Date;
  _count?: { messages: number };
  messages: Array<{
    bodyText: string | null;
    fromAddress: string;
    direction: string;
    sentAt: string | Date;
    attachments?: Array<{
      id: string;
      filename: string;
      size?: number | null;
    }>;
  }>;
};

export function ConversationList({
  conversations,
  folder = "inbox",
  query,
  page = 1,
  pageSize = 50,
  total = 0,
}: {
  conversations: ConversationListItem[];
  folder?: ConversationFolder;
  query?: string;
  page?: number;
  pageSize?: number;
  total?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refreshing, startRefresh] = useTransition();
  const [paging, startPaging] = useTransition();
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [moving, startMove] = useTransition();
  const movingRef = useRef(false);

  const selectedIds = conversations
    .filter((c) => checked[c.id])
    .map((c) => c.id);

  const emptyTitle =
    folder === "sent"
      ? "No sent mail"
      : folder === "trash"
        ? "Trash is empty"
        : "Your inbox is empty";
  const emptyBody =
    folder === "sent"
      ? "Messages you send will show up here."
      : folder === "trash"
        ? query
          ? "No conversations match your search."
          : "Conversations you delete will show up here."
        : query
          ? "No conversations match your search."
          : "Compose a new email or connect Resend to receive inbound mail.";

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages) return;
    startPaging(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (folder === "sent" || folder === "trash") params.set("folder", folder);
      else params.delete("folder");
      if (query?.trim()) params.set("q", query.trim());
      else params.delete("q");
      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");
      const qs = params.toString();
      router.push(qs ? `/inbox?${qs}` : "/inbox");
    });
  }

  function refresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function applyTrashAction(action: "trash" | "restore", ids: string[]) {
    if (ids.length === 0 || movingRef.current) return;
    movingRef.current = true;
    startMove(async () => {
      try {
        const updated = await patchConversations(action, ids);
        setChecked({});
        if (action === "trash") {
          toast(
            updated === 1
              ? "Conversation moved to Trash"
              : `${updated} conversations moved to Trash`,
            {
              duration: 8000,
              action: {
                label: "Undo",
                onClick: () => {
                  void patchConversations("restore", ids)
                    .then(() => router.refresh())
                    .catch((error: unknown) => {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Couldn't update Trash",
                      );
                    });
                },
              },
            },
          );
        } else {
          toast(
            updated === 1
              ? "Conversation moved to Inbox"
              : `${updated} conversations moved to Inbox`,
          );
        }
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't update Trash",
        );
      } finally {
        movingRef.current = false;
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative z-10 flex shrink-0 items-center gap-[0.5rem] border-b border-black/[0.04] px-[0.75rem] py-[0.5rem] shadow-[1px 1px 4px #ddd] dark:border-white/[0.06]">
        <h1 className="pl-[0.25rem] text-[1rem] font-semibold tracking-tight capitalize">
          {folder}
        </h1>
        {selectedIds.length > 0 ? (
          folder === "trash" ? (
            <button
              type="button"
              disabled={moving}
              onClick={() => applyTrashAction("restore", selectedIds)}
              className="inline-flex h-[2rem] items-center gap-[0.35rem] rounded-full px-[0.75rem] text-[0.8125rem] font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Inbox className="size-[1rem]" strokeWidth={2.25} />
              Move to Inbox
            </button>
          ) : (
            <button
              type="button"
              disabled={moving}
              onClick={() => applyTrashAction("trash", selectedIds)}
              className="inline-flex h-[2rem] items-center gap-[0.35rem] rounded-full px-[0.75rem] text-[0.8125rem] font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <Trash2 className="size-[1rem]" strokeWidth={2.25} />
              Move to Trash
            </button>
          )
        ) : null}
        {query ? (
          <span className="min-w-0 truncate text-[0.875rem] text-muted-foreground">
            Results for “{query}”
          </span>
        ) : null}
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh"
          title="Refresh"
          className="ml-[0.25rem] inline-flex size-[2rem] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60"
        >
          <RefreshCw
            className={cn("size-[1rem]", refreshing && "animate-spin")}
            strokeWidth={2.25}
          />
        </button>
        <div className="flex-1" />
        <div
          className={cn(
            "flex items-center gap-[0.15rem] text-[0.75rem] text-muted-foreground",
            paging && "opacity-70",
          )}
        >
          <span className="tabular-nums whitespace-nowrap px-[0.35rem]">
            {total === 0
              ? "0–0 of 0"
              : `${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${total.toLocaleString()}`}
          </span>
          <button
            type="button"
            aria-label="Newer"
            title="Newer"
            disabled={!canPrev || paging}
            onClick={() => goToPage(page - 1)}
            className="inline-flex size-[2rem] items-center justify-center rounded-full hover:bg-muted disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft className="size-[1.15rem]" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="Older"
            title="Older"
            disabled={!canNext || paging}
            onClick={() => goToPage(page + 1)}
            className="inline-flex size-[2rem] items-center justify-center rounded-full hover:bg-muted disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight className="size-[1.15rem]" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-[0.5rem] px-[1.5rem] py-[6rem] text-center">
            <p className="text-[0.875rem] font-medium">{emptyTitle}</p>
            <p className="max-w-sm text-[0.875rem] text-muted-foreground">
              {emptyBody}
            </p>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => {
              const preview = c.messages[0];
              const unread = Boolean(c.unread);
              const messageCount = c._count?.messages ?? c.messages.length;
              const sender =
                folder === "sent"
                  ? c.participants.split(",")[0]?.trim() ||
                    preview?.fromAddress ||
                    "Unknown"
                  : preview?.fromAddress ||
                    c.participants.split(",")[0]?.trim() ||
                    "Unknown";
              const snippet = preview?.bodyText?.replace(/\s+/g, " ").trim();
              const attachments = preview?.attachments ?? [];
              const mailbox = searchParams.get("mailbox");
              const hrefParams = new URLSearchParams();
              if (folder !== "inbox") hrefParams.set("folder", folder);
              if (mailbox) hrefParams.set("mailbox", mailbox);
              const hrefQs = hrefParams.toString();
              const href = hrefQs
                ? `/inbox/${c.id}?${hrefQs}`
                : `/inbox/${c.id}`;

              return (
                <li
                  key={c.id}
                  className="border-b border-black/[0.08] dark:border-white/[0.09]"
                >
                  <div
                    className={cn(
                      "group relative flex items-stretch gap-[0.25rem] border-l-[3px] border-l-transparent transition-colors",
                      "hover:z-[1] hover:shadow-[1px_1px_4px_#bbb] dark:hover:shadow-[1px_1px_4px_rgba(0,0,0,0.35)]",
                      unread
                        ? "border-l-[#0b57d0] bg-[#f2f6fc] dark:border-l-[rgba(168,199,250,0.55)] dark:bg-muted/35"
                        : "bg-card",
                      checked[c.id] &&
                        "border-l-[#0b57d0] bg-[#c2e7ff]/40 dark:bg-muted/50",
                    )}
                  >
                    <div className="flex shrink-0 items-center gap-[0.125rem] py-[0.75rem] pl-[0.75rem]">
                      <input
                        type="checkbox"
                        checked={Boolean(checked[c.id])}
                        onChange={(e) => {
                          e.stopPropagation();
                          setChecked((prev) => ({
                            ...prev,
                            [c.id]: e.target.checked,
                          }));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="size-[1rem] rounded border-muted-foreground/40"
                        aria-label="Select conversation"
                      />
                      <button
                        type="button"
                        aria-label={starred[c.id] ? "Unstar" : "Star"}
                        className="inline-flex size-[2rem] items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStarred((prev) => ({
                            ...prev,
                            [c.id]: !prev[c.id],
                          }));
                        }}
                      >
                        <Star
                          className={cn(
                            "size-[1rem]",
                            starred[c.id] && "fill-amber-400 text-amber-400",
                          )}
                          strokeWidth={2.25}
                        />
                      </button>
                    </div>

                    <Link
                      href={href}
                      className="grid min-w-0 flex-1 grid-cols-1 items-center gap-x-[0.75rem] py-[0.75rem] pr-[1rem] sm:grid-cols-[11rem_minmax(0,1fr)_auto]"
                    >
                      <span
                        className={cn(
                          "flex min-w-0 items-center gap-[0.35rem] truncate text-[0.875rem] text-foreground",
                          unread ? "font-bold" : "font-medium",
                        )}
                      >
                        <span className="truncate">
                          {folder === "sent"
                            ? `To: ${displayNameFromAddress(sender)}`
                            : displayNameFromAddress(sender)}
                        </span>
                        {messageCount > 1 ? (
                          <span
                            className={cn(
                              "shrink-0 text-[0.75rem] font-semibold tabular-nums text-muted-foreground",
                              unread && "text-foreground/70",
                            )}
                          >
                            ({messageCount})
                          </span>
                        ) : null}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[0.875rem]">
                          <span
                            className={cn(
                              "text-foreground",
                              unread ? "font-bold" : "font-medium",
                            )}
                          >
                            {c.subject || "(no subject)"}
                          </span>
                          {snippet ? (
                            <span className="font-normal text-muted-foreground">
                              {" — "}
                              {snippet}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "flex items-center gap-[0.35rem] justify-self-start text-[0.75rem] whitespace-nowrap text-muted-foreground sm:justify-self-end",
                          unread && "font-bold text-foreground",
                          folder !== "trash" && "sm:group-hover:invisible",
                        )}
                      >
                        {attachments.length > 0 ? (
                          <Paperclip
                            className="size-[0.875rem] shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                            aria-label="Has attachment"
                          />
                        ) : null}
                        <span suppressHydrationWarning>
                          {formatMailListDate(c.lastMessageAt)}
                        </span>
                      </span>
                    </Link>
                    {folder !== "trash" ? (
                      <button
                        type="button"
                        aria-label="Move to Trash"
                        title="Move to Trash"
                        disabled={moving}
                        onClick={() => applyTrashAction("trash", [c.id])}
                        className="absolute top-1/2 right-[0.75rem] inline-flex size-[2rem] -translate-y-1/2 items-center justify-center rounded-full bg-inherit text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60 sm:pointer-events-none sm:opacity-0 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100"
                      >
                        <Trash2 className="size-[1rem]" strokeWidth={2.25} />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
