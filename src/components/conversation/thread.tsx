"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Reply, ReplyAll, Star } from "lucide-react";
import { EmailComposer } from "@/components/conversation/email-composer";
import { AttachmentChip } from "@/components/conversation/attachment-chip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  emailFromAddress,
  formatAddresses,
  formatMailbox,
  formatRelativeEmailDate,
  initialsFromAddress,
  mailedByDomain,
  parseEmailAddress,
  shortRecipientLabel,
} from "@/lib/email/display";
import { splitQuotedBody } from "@/lib/email/trim-quotes";
import type { ComposerAttachment } from "@/lib/email/attachments-client";

export type ThreadMessage = {
  id: string;
  direction: "inbound" | "outbound";
  fromAddress: string;
  toAddresses: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  sentAt: string | Date;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string | null;
    size: number | null;
  }>;
};

const emailBodyClassName =
  "email-body max-w-none text-[0.9375rem] leading-[1.6] font-normal [&_a]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_p]:my-[0.4em] [&_blockquote]:my-[0.5em] [&_blockquote]:border-l-[0.1875rem] [&_blockquote]:border-[#ccc] [&_blockquote]:pl-[0.75rem] [&_blockquote]:text-[#555] [&_table]:max-w-full dark:[&_a]:text-blue-400 dark:[&_blockquote]:border-[#666] dark:[&_blockquote]:text-muted-foreground";

function TrimQuotesToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="mt-[0.35rem] inline-flex h-[1.25rem] cursor-pointer items-center justify-center rounded-full bg-[#e8eaed] px-[0.55rem] text-[0.8125rem] leading-none font-bold tracking-[0.08em] text-[#5f6368] hover:bg-[#dadce0] hover:text-[#202124] dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
      aria-expanded={expanded}
      aria-label={expanded ? "Hide trimmed content" : "Show trimmed content"}
    >
      ···
    </button>
  );
}

function MessageBody({ message }: { message: ThreadMessage }) {
  const [quotesExpanded, setQuotesExpanded] = useState(false);
  const split = useMemo(
    () =>
      splitQuotedBody({
        html: message.bodyHtml,
        text: message.bodyText,
      }),
    [message.bodyHtml, message.bodyText],
  );
  const hasQuote = Boolean(split.quoted);

  return (
    <div className="cursor-text select-text">
      {split.mode === "html" ? (
        <div className="overflow-x-auto text-foreground">
          <div
            className={emailBodyClassName}
            dangerouslySetInnerHTML={{ __html: split.visible }}
          />
          {hasQuote ? (
            <div className="mt-[0.15rem]">
              <TrimQuotesToggle
                expanded={quotesExpanded}
                onToggle={() => setQuotesExpanded((v) => !v)}
              />
              {quotesExpanded ? (
                <div
                  className={cn(emailBodyClassName, "mt-[0.5rem]")}
                  dangerouslySetInnerHTML={{ __html: split.quoted! }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-[0.9375rem] leading-[1.6] font-normal text-foreground">
          {split.visible.trim() ? (
            <div className="whitespace-pre-wrap">{split.visible}</div>
          ) : (
            <span className="text-muted-foreground italic">
              No message body
            </span>
          )}
          {hasQuote ? (
            <div className="mt-[0.15rem]">
              <TrimQuotesToggle
                expanded={quotesExpanded}
                onToggle={() => setQuotesExpanded((v) => !v)}
              />
              {quotesExpanded ? (
                <div className="mt-[0.5rem] whitespace-pre-wrap text-muted-foreground">
                  {split.quoted}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {message.attachments.length > 0 ? (
        <div className="mt-[0.75rem] flex flex-wrap gap-[0.375rem]">
          {message.attachments.map((a) => (
            <AttachmentChip
              key={a.id}
              id={a.id}
              filename={a.filename}
              size={a.size}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MessageDetailsPopover({
  message,
  open,
  onClose,
}: {
  message: ThreadMessage;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const from = parseEmailAddress(message.fromAddress);
  const tos = message.toAddresses
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseEmailAddress);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: "from:",
      value: (
        <span>
          <span className="font-semibold">{from.name}</span>
          {from.email ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              &lt;{from.email}&gt;
            </span>
          ) : null}
        </span>
      ),
    },
    {
      label: "to:",
      value: tos.map((t, i) => (
        <span key={`${t.email}-${i}`}>
          {i > 0 ? ", " : null}
          {t.email || t.name}
        </span>
      )),
    },
    {
      label: "date:",
      value: (
        <span suppressHydrationWarning>
          {formatRelativeEmailDate(message.sentAt)}
        </span>
      ),
    },
    {
      label: "subject:",
      value: message.subject || "(no subject)",
    },
  ];

  const mailedBy = mailedByDomain(from.email);
  if (mailedBy) {
    rows.push({ label: "mailed-by:", value: mailedBy });
  }

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-30 mt-[0.25rem] min-w-[18rem] max-w-[min(28rem,90vw)] rounded-[0.5rem] border border-black/10 bg-card p-[0.75rem] text-[0.8125rem] shadow-lg dark:border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <dl className="grid grid-cols-[5.5rem_1fr] gap-x-[0.75rem] gap-y-[0.35rem]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-right font-normal text-muted-foreground">
              {row.label}
            </dt>
            <dd className="min-w-0 break-words font-normal text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ThreadMessageRow({
  message,
  expanded,
  locked,
  onToggle,
}: {
  message: ThreadMessage;
  expanded: boolean;
  locked?: boolean;
  onToggle: () => void;
}) {
  const [starred, setStarred] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const from = parseEmailAddress(message.fromAddress);
  const firstTo = message.toAddresses.split(",")[0]?.trim() || "";
  const toLabel = shortRecipientLabel(firstTo);
  const snippet =
    message.bodyText?.replace(/\s+/g, " ").trim() ||
    (message.bodyHtml ? "HTML message" : "No message body");
  const canToggle = !locked;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-[0.75rem] border-b border-black/[0.08] px-[1rem] py-[0.75rem] text-left sm:px-[1.5rem] dark:border-white/[0.09]"
      >
        <Avatar
          size="default"
          className="mt-[0.125rem] size-[2.5rem] shrink-0 bg-[#c2e7ff] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]"
        >
          <AvatarFallback className="bg-transparent text-[0.875rem] font-semibold text-inherit">
            {initialsFromAddress(message.fromAddress)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-[0.5rem]">
            <span className="shrink-0 text-[0.875rem] font-semibold">
              {from.name}
            </span>
            <span className="min-w-0 truncate text-[0.875rem] font-normal text-muted-foreground">
              {snippet}
            </span>
          </div>
        </div>
        <span
          className="shrink-0 pt-[0.125rem] text-[0.75rem] font-normal text-muted-foreground"
          suppressHydrationWarning
        >
          {formatRelativeEmailDate(message.sentAt).split(" (")[0]}
        </span>
      </button>
    );
  }

  return (
    <div className="border-b border-black/[0.08] last:border-b-0 dark:border-white/[0.09]">
      <div
        role={canToggle ? "button" : undefined}
        tabIndex={canToggle ? 0 : undefined}
        onClick={canToggle ? onToggle : undefined}
        onKeyDown={
          canToggle
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle();
                }
              }
            : undefined
        }
        className={cn(
          "flex w-full items-start gap-[0.75rem] px-[1rem] py-[0.75rem] sm:px-[1.5rem]",
          canToggle && "cursor-pointer",
          !canToggle && "cursor-default",
        )}
      >
        <Avatar
          size="default"
          className="mt-[0.125rem] size-[2.5rem] shrink-0 bg-[#c2e7ff] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]"
        >
          <AvatarFallback className="bg-transparent text-[0.875rem] font-semibold text-inherit">
            {initialsFromAddress(message.fromAddress)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-[0.5rem]">
            <div className="relative min-w-0">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-[0.35rem]">
                <span className="text-[0.875rem] font-semibold text-foreground">
                  {from.name}
                </span>
                {from.email ? (
                  <span className="truncate text-[0.8125rem] font-normal text-muted-foreground">
                    &lt;{from.email}&gt;
                  </span>
                ) : null}
              </div>

              <div className="relative mt-[0.1rem]">
                <button
                  type="button"
                  className="inline-flex max-w-full cursor-pointer items-center gap-[0.15rem] rounded-[0.25rem] text-[0.75rem] font-normal text-muted-foreground hover:bg-muted/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailsOpen((v) => !v);
                  }}
                  aria-expanded={detailsOpen}
                  aria-label="Show message details"
                >
                  <span className="truncate">to {toLabel}</span>
                  <ChevronDown
                    className="size-[0.875rem] shrink-0"
                    strokeWidth={2.25}
                  />
                </button>
                <MessageDetailsPopover
                  message={message}
                  open={detailsOpen}
                  onClose={() => setDetailsOpen(false)}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[0.125rem] pt-[0.125rem]">
              <span
                className="px-[0.25rem] text-[0.75rem] font-normal text-muted-foreground"
                suppressHydrationWarning
              >
                {formatRelativeEmailDate(message.sentAt)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-[2rem] cursor-pointer"
                aria-label={starred ? "Unstar" : "Star"}
                onClick={(e) => {
                  e.stopPropagation();
                  setStarred((v) => !v);
                }}
              >
                <Star
                  className={cn(
                    "size-[1rem]",
                    starred && "fill-amber-400 text-amber-400",
                  )}
                  strokeWidth={2.25}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="cursor-text px-[1rem] pt-[0.15rem] pb-[0.75rem] pl-[calc(1rem+2.5rem+0.75rem)] sm:px-[1.5rem] sm:pl-[calc(1.5rem+2.5rem+0.75rem)] sm:pb-[0.75rem]">
        <MessageBody message={message} />
      </div>
    </div>
  );
}

function uniqueAddresses(...groups: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of groups) {
    for (const part of group.split(",")) {
      const value = part.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

export function ConversationThread({
  conversationId,
  subject,
  participants,
  messages,
  backHref = "/inbox",
}: {
  conversationId: string;
  subject: string;
  participants: string;
  messages: ThreadMessage[];
  backHref?: string;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMode, setReplyMode] = useState<"reply" | "replyAll">("reply");
  const lastId = messages[messages.length - 1]?.id;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(lastId ? [lastId] : []),
  );

  const effectiveExpanded = useMemo(() => {
    const next = new Set(expandedIds);
    if (lastId) next.add(lastId);
    return next;
  }, [expandedIds, lastId]);

  const lastInbound = useMemo(
    () => [...messages].reverse().find((m) => m.direction === "inbound"),
    [messages],
  );

  const replyFrom = lastInbound
    ? formatMailbox(
        formatAddresses(lastInbound.toAddresses).split(",")[0]?.trim() || "",
      )
    : "";

  const replyTo = lastInbound ? formatMailbox(lastInbound.fromAddress) : "";

  const replyAllTo = useMemo(() => {
    if (!lastInbound) return "";
    const fromEmail = emailFromAddress(replyFrom).toLowerCase();
    const others = uniqueAddresses(
      lastInbound.fromAddress,
      lastInbound.toAddresses,
    )
      .map(formatMailbox)
      .filter((addr) => emailFromAddress(addr).toLowerCase() !== fromEmail);
    return others.join(", ");
  }, [lastInbound, replyFrom]);

  const showReplyAll =
    uniqueAddresses(replyAllTo).length > 1 ||
    uniqueAddresses(lastInbound?.toAddresses ?? "").length > 1;

  const activeReplyTo = replyMode === "replyAll" ? replyAllTo : replyTo;

  function toggleMessage(id: string) {
    if (id === lastId) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (lastId) next.add(lastId);
      return next;
    });
  }

  function openReply(mode: "reply" | "replyAll") {
    setReplyMode(mode);
    setReplyOpen(true);
  }

  async function handleSend(body: {
    html: string;
    text: string;
    to?: string;
    attachments: ComposerAttachment[];
  }) {
    const res = await fetch(`/api/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: body.to,
        html: body.html,
        text: body.text,
        attachments: body.attachments.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          content: a.content,
          size: a.size,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to send reply");
      throw new Error(data.error ?? "Failed to send reply");
    }
    toast.success("Reply sent");
    setReplyOpen(false);
    router.refresh();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <header className="shrink-0 px-[0.5rem] pt-[0.5rem] pb-[0.25rem] sm:px-[1rem]">
        <div className="flex items-center gap-[0.25rem]">
          <Link
            href={backHref}
            aria-label="Back to list"
            className="inline-flex size-[2.5rem] items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <ArrowLeft className="size-[1.25rem]" strokeWidth={2.25} />
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-[0.5rem] px-[0.5rem] pt-[0.25rem] pb-[0.75rem] sm:px-[0.75rem]">
          <h1 className="text-[1.25rem] font-normal tracking-tight text-balance sm:text-[1.5rem]">
            {subject || "(no subject)"}
          </h1>
          <span className="rounded-[0.25rem] bg-muted px-[0.375rem] py-[0.125rem] text-[0.6875rem] font-medium text-muted-foreground">
            Inbox
          </span>
        </div>
        <p className="sr-only">{formatAddresses(participants)}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="px-[1rem] py-[4rem] text-center text-[0.875rem] text-muted-foreground sm:px-[1.5rem]">
            No messages in this thread yet.
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <ThreadMessageRow
                key={message.id}
                message={message}
                expanded={effectiveExpanded.has(message.id)}
                locked={message.id === lastId}
                onToggle={() => toggleMessage(message.id)}
              />
            ))}
          </div>
        )}

        <div className="px-[1rem] py-[1.25rem] sm:px-[1.5rem]">
          {!replyOpen ? (
            <div className="flex flex-wrap items-center gap-[0.5rem]">
              <Button
                type="button"
                variant="outline"
                className="h-[2.25rem] rounded-full border-black/10 px-[1rem] font-medium dark:border-white/10"
                onClick={() => openReply("reply")}
              >
                <Reply className="size-[1rem]" strokeWidth={2.25} />
                Reply
              </Button>
              {showReplyAll ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-[2.25rem] rounded-full border-black/10 px-[1rem] font-medium dark:border-white/10"
                  onClick={() => openReply("replyAll")}
                >
                  <ReplyAll className="size-[1rem]" strokeWidth={2.25} />
                  Reply all
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex w-full gap-[0.75rem]">
              <Avatar
                size="default"
                className="mt-[0.25rem] size-[2.5rem] shrink-0 bg-[#c2e7ff] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]"
              >
                <AvatarFallback className="bg-transparent text-[0.875rem] font-semibold text-inherit">
                  {initialsFromAddress(replyFrom || "me")}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-h-[20rem] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[1rem] border border-black/10 bg-background shadow-sm sm:min-h-[22rem] dark:border-white/10">
                <EmailComposer
                  from={replyFrom}
                  to={activeReplyTo}
                  onSend={handleSend}
                  variant="mail-reply"
                  replyKind={replyMode}
                  fillHeight
                  showMeta={false}
                  title=""
                  placeholder="Write your reply…"
                  className="h-full min-h-[20rem] sm:min-h-[22rem]"
                  onDiscard={() => setReplyOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
