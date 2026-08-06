"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

function formatAddresses(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

function formatEmailDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function EmailMessage({ message }: { message: ThreadMessage }) {
  const hasHtml = Boolean(message.bodyHtml?.trim());

  return (
    <article className="border-b border-border/60 last:border-b-0">
      <div className="px-6 py-5">
        <div className="space-y-1.5 text-sm">
          <div className="grid grid-cols-[4.5rem_1fr] gap-x-3 gap-y-1 sm:grid-cols-[5rem_1fr]">
            <span className="text-muted-foreground">From</span>
            <span className="break-all font-medium text-foreground">
              {message.fromAddress}
            </span>

            <span className="text-muted-foreground">To</span>
            <span className="break-all text-foreground/90">
              {formatAddresses(message.toAddresses)}
            </span>

            <span className="text-muted-foreground">Date</span>
            <span className="text-foreground/90" suppressHydrationWarning>
              {formatEmailDate(message.sentAt)}
            </span>
          </div>
        </div>

        {message.attachments.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.attachments.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded border border-border/70 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Paperclip className="size-3.5 shrink-0" />
                <span className="truncate">{a.filename}</span>
                {a.size != null ? (
                  <span className="text-muted-foreground/70">
                    ({Math.max(1, Math.round(a.size / 1024))} KB)
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="px-6 pb-6">
        {hasHtml ? (
          <div className="overflow-hidden rounded-md border border-border/50 bg-white text-neutral-900 shadow-sm">
            <div
              className="email-body max-w-none px-5 py-4 text-[15px] leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_p]:my-2 [&_table]:max-w-full"
              dangerouslySetInnerHTML={{ __html: message.bodyHtml! }}
            />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/95">
            {message.bodyText?.trim() || (
              <span className="text-muted-foreground italic">No message body</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ConversationThread({
  conversationId,
  subject,
  participants,
  messages,
}: {
  conversationId: string;
  subject: string;
  participants: string;
  messages: ThreadMessage[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const lastInbound = [...messages].reverse().find((m) => m.direction === "inbound");
  const replyTo = lastInbound?.fromAddress ?? "";
  const replyFrom = lastInbound
    ? formatAddresses(lastInbound.toAddresses).split(",")[0]?.trim() || ""
    : "";

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send reply");
        return;
      }
      setBody("");
      toast.success("Reply sent");
      router.refresh();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border/60 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          {subject}
        </h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {formatAddresses(participants)}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No messages in this thread yet.
          </div>
        ) : (
          messages.map((message) => (
            <EmailMessage key={message.id} message={message} />
          ))
        )}
      </div>

      <form
        onSubmit={onReply}
        className="shrink-0 border-t border-border/60 bg-background/95 px-6 py-4 backdrop-blur"
      >
        <p className="mb-3 text-sm font-medium">Reply</p>
        <div className="mb-3 grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1 text-sm">
          {replyFrom ? (
            <>
              <span className="text-muted-foreground">From</span>
              <span className="truncate text-foreground/90">{replyFrom}</span>
            </>
          ) : null}
          {replyTo ? (
            <>
              <span className="text-muted-foreground">To</span>
              <span className="truncate text-foreground/90">{replyTo}</span>
            </>
          ) : null}
        </div>
        <Textarea
          placeholder="Write your reply…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          className="min-h-28 resize-y bg-muted/20"
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button type="submit" disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
