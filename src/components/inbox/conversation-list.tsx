"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Paperclip, RefreshCw, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  displayNameFromAddress,
  formatMailListDate,
} from "@/lib/email/display";

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
  folder?: "inbox" | "sent";
  query?: string;
  page?: number;
  pageSize?: number;
  total?: number;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [paging, startPaging] = useTransition();
  const [starred, setStarred] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const emptyTitle =
    folder === "sent" ? "No sent mail" : "Your inbox is empty";
  const emptyBody =
    folder === "sent"
      ? "Messages you send will show up here."
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
      const params = new URLSearchParams();
      if (folder === "sent") params.set("folder", "sent");
      if (query?.trim()) params.set("q", query.trim());
      if (nextPage > 1) params.set("page", String(nextPage));
      const qs = params.toString();
      router.push(qs ? `/inbox?${qs}` : "/inbox");
    });
  }

  function refresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-[0.5rem] border-b border-black/[0.04] px-[0.75rem] py-[0.5rem] dark:border-white/[0.06]">
        <h1 className="pl-[0.25rem] text-[1rem] font-semibold tracking-tight capitalize">
          {folder}
        </h1>
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
              const href =
                folder === "sent"
                  ? `/inbox/${c.id}?folder=sent`
                  : `/inbox/${c.id}`;

              return (
                <li
                  key={c.id}
                  className="border-b border-black/[0.04] dark:border-white/[0.05]"
                >
                  <div
                    className={cn(
                      "group relative flex items-stretch gap-[0.25rem] transition-colors",
                      "hover:z-[1] hover:bg-[#f6f8fc] dark:hover:bg-muted/40",
                      unread
                        ? "bg-[#f2f6fc] shadow-[inset_3px_0_0_0_#0b57d0] dark:bg-muted/35 dark:shadow-[inset_3px_0_0_0_rgba(168,199,250,0.55)]"
                        : "bg-card",
                      checked[c.id] &&
                        "bg-[#c2e7ff]/40 shadow-[inset_3px_0_0_0_#0b57d0] dark:bg-muted/50",
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
                            starred[c.id] &&
                              "fill-amber-400 text-amber-400",
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
