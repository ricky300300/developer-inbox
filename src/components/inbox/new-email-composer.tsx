"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EmailComposer,
  type EmailComposerHandle,
} from "@/components/conversation/email-composer";

type ConnectionSummary = {
  id: string;
  fromEmail: string;
  isActive: boolean;
};

export function NewEmailComposer({ fromEmail }: { fromEmail?: string }) {
  const router = useRouter();
  const editorRef = useRef<EmailComposerHandle>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState(fromEmail ?? "");
  const [sending, setSending] = useState(false);
  const [bodyEmpty, setBodyEmpty] = useState(true);
  const [loadingFrom, setLoadingFrom] = useState(!fromEmail);

  useEffect(() => {
    if (fromEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/providers/connections");
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const active = (data.connections as ConnectionSummary[] | undefined)?.find(
          (c) => c.isActive && c.fromEmail,
        );
        if (active?.fromEmail) setFrom(active.fromEmail);
      } finally {
        if (!cancelled) setLoadingFrom(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromEmail]);

  async function send() {
    if (sending) return;
    if (!to.trim()) {
      toast.error("Add at least one recipient");
      return;
    }
    if (!from.trim()) {
      toast.error("From address is required");
      return;
    }

    const bodies = editorRef.current?.getBodies();
    if (!bodies || bodies.isEmpty) {
      toast.error("Write a message before sending");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from.trim(),
          to: to.trim(),
          subject: subject.trim(),
          html: bodies.html,
          text: bodies.text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send email");
        return;
      }
      toast.success("Email sent");
      editorRef.current?.clear();
      router.push(`/inbox/${data.conversation.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await send();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">New message</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close composer"
          onClick={() => router.push("/inbox")}
        >
          <X className="size-4" />
        </Button>
      </header>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-3 border-b border-border/60 px-6 py-4">
          <div className="grid grid-cols-[4.5rem_1fr] items-center gap-x-3 gap-y-3 text-sm sm:grid-cols-[5rem_1fr]">
            <Label htmlFor="compose-from" className="text-muted-foreground">
              From
            </Label>
            <Input
              id="compose-from"
              type="email"
              autoComplete="email"
              placeholder={loadingFrom ? "Loading…" : "you@yourdomain.com"}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
              disabled={loadingFrom}
            />

            <Label htmlFor="compose-to" className="text-muted-foreground">
              To
            </Label>
            <Input
              id="compose-to"
              type="text"
              autoComplete="email"
              placeholder="name@example.com, other@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              autoFocus
            />

            <Label htmlFor="compose-subject" className="text-muted-foreground">
              Subject
            </Label>
            <Input
              id="compose-subject"
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <EmailComposer
            ref={editorRef}
            asForm={false}
            showMeta={false}
            showSendButton={false}
            title=""
            placeholder="Write your message…"
            disabled={sending}
            editorClassName="min-h-64 max-h-none"
            onEmptyChange={setBodyEmpty}
            onRequestSend={() => void send()}
          />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Prefills from Settings · must be a verified Resend sender · ⌘/Ctrl + Enter
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/inbox")}
              disabled={sending}
            >
              Discard
            </Button>
            <Button type="submit" disabled={sending || bodyEmpty || !to.trim() || !from.trim()}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
