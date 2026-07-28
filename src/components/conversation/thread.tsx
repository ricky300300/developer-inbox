"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">{subject}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {participants.replace(/,/g, ", ")}
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "rounded-lg border border-border/50 p-4",
              message.direction === "outbound" ? "bg-muted/30" : "bg-transparent",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{message.fromAddress}</span>
              <Badge variant="secondary" className="font-normal">
                {message.direction}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(message.sentAt).toLocaleString()}
              </span>
            </div>
            {message.bodyHtml ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">
                {message.bodyText ?? ""}
              </pre>
            )}
            {message.attachments.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.attachments.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground"
                  >
                    <Paperclip className="size-3" />
                    {a.filename}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <Separator />
      <form onSubmit={onReply} className="space-y-3 p-4">
        <Textarea
          placeholder="Write a reply…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
