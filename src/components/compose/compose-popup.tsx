"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Maximize2,
  Minimize2,
  Minus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmailComposer,
  type EmailComposerHandle,
} from "@/components/conversation/email-composer";
import { cn } from "@/lib/utils";

type ConnectionSummary = {
  id: string;
  fromEmail: string;
  isActive: boolean;
};

type ComposePopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ComposePopup({ open, onOpenChange }: ComposePopupProps) {
  const router = useRouter();
  const editorRef = useRef<EmailComposerHandle>(null);
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [sending, setSending] = useState(false);
  const [bodyEmpty, setBodyEmpty] = useState(true);
  const [loadingFrom, setLoadingFrom] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const dirty =
    Boolean(to.trim() || cc.trim() || subject.trim() || !bodyEmpty);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/providers/connections");
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const active = (
          data.connections as ConnectionSummary[] | undefined
        )?.find((c) => c.isActive && c.fromEmail);
        if (active?.fromEmail) setFrom(active.fromEmail);
      } finally {
        if (!cancelled) setLoadingFrom(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function reset() {
    setTo("");
    setCc("");
    setShowCc(false);
    setSubject("");
    setBodyEmpty(true);
    setMinimized(false);
    setExpanded(false);
    editorRef.current?.clear();
  }

  function requestClose() {
    if (dirty && !window.confirm("Discard this message?")) return;
    reset();
    onOpenChange(false);
  }

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

    const recipients = [to.trim(), cc.trim()].filter(Boolean).join(", ");

    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from.trim(),
          to: recipients,
          subject: subject.trim(),
          html: bodies.html,
          text: bodies.text,
          attachments: bodies.attachments.map((a) => ({
            filename: a.filename,
            contentType: a.contentType,
            content: a.content,
            size: a.size,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send email");
        return;
      }
      toast.success("Email sent");
      reset();
      onOpenChange(false);
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

  if (!open) return null;

  if (minimized) {
    return (
      <div className="fixed right-4 bottom-0 z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-t-xl border border-border/70 bg-card shadow-2xl">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 bg-zinc-800 px-4 py-3 text-left text-sm font-medium text-white dark:bg-zinc-700"
          onClick={() => setMinimized(false)}
        >
          <span className="truncate">
            {subject.trim() || "New Message"}
          </span>
          <span className="flex items-center gap-1">
            <span
              role="button"
              tabIndex={0}
              aria-label="Expand compose"
              className="rounded p-1 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setMinimized(false);
                }
              }}
            >
              <Maximize2 className="size-3.5" />
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Close compose"
              className="rounded p-1 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                requestClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  requestClose();
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden border border-border/70 bg-card shadow-2xl",
        expanded
          ? "inset-3 rounded-2xl sm:inset-6"
          : "inset-x-0 bottom-0 h-[min(92dvh,40rem)] rounded-t-2xl sm:inset-x-auto sm:right-4 sm:bottom-0 sm:h-[min(36rem,85dvh)] sm:w-[min(100vw-2rem,34rem)] sm:rounded-t-xl",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 bg-zinc-800 px-3 py-2.5 text-white dark:bg-zinc-700">
        <p className="truncate px-1 text-sm font-medium">New Message</p>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-white hover:bg-white/10 hover:text-white"
            aria-label="Minimize"
            onClick={() => setMinimized(true)}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-white hover:bg-white/10 hover:text-white"
            aria-label={expanded ? "Exit full screen" : "Full screen"}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-white hover:bg-white/10 hover:text-white"
            aria-label="Close"
            onClick={requestClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </header>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border/50 px-4">
          <div className="flex items-center gap-2 border-b border-border/40 py-2">
            <Input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder={loadingFrom ? "Loading…" : "From"}
              aria-label="From"
              disabled={loadingFrom || sending}
              required
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 border-b border-border/40 py-2">
            <Input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To"
              aria-label="To"
              required
              autoFocus
              disabled={sending}
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
            {!showCc ? (
              <button
                type="button"
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowCc(true)}
              >
                Cc
              </button>
            ) : null}
          </div>
          {showCc ? (
            <div className="flex items-center gap-2 border-b border-border/40 py-2">
              <Input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Cc"
                aria-label="Cc"
                disabled={sending}
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          ) : null}
          <div className="flex items-center gap-2 py-2">
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              aria-label="Subject"
              disabled={sending}
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-0">
          <EmailComposer
            ref={editorRef}
            asForm={false}
            fillHeight
            variant="mail-compose"
            showMeta={false}
            showSendButton={false}
            title=""
            placeholder="Write your message…"
            disabled={sending}
            className="min-h-0 flex-1 border-0 bg-transparent p-0"
            editorClassName="rounded-none border-0 shadow-none"
            onEmptyChange={setBodyEmpty}
            onRequestSend={() => void send()}
            onDiscard={requestClose}
          />
        </div>
      </form>
    </div>
  );
}
