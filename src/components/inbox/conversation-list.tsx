"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { PenSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type ConversationListItem = {
  id: string;
  subject: string;
  participants: string;
  lastMessageAt: string | Date;
  messages: Array<{
    bodyText: string | null;
    fromAddress: string;
    direction: string;
    sentAt: string | Date;
  }>;
};

function formatRelative(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString();
}

export function ConversationList({
  conversations,
  activeId,
  query,
}: {
  conversations: ConversationListItem[];
  activeId?: string;
  query?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const composing = pathname === "/inbox/compose";
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query ?? "");

  useEffect(() => {
    setSearch(query ?? "");
  }, [query]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = search.trim();
      const current = (query ?? "").trim();
      if (next === current) return;
      startTransition(() => {
        const params = new URLSearchParams();
        if (next) params.set("q", next);
        // Keep user on compose while searching the list
        const base = composing ? "/inbox/compose" : "/inbox";
        router.push(params.size ? `${base}?${params}` : base);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [search, query, router, composing]);

  return (
    <div className="flex h-full flex-col border-r border-border/60">
      <div className="space-y-2 border-b border-border/60 p-3">
        <Link
          href="/inbox/compose"
          className={cn(
            "inline-flex h-8 w-full items-center justify-start gap-2 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80",
          )}
        >
          <PenSquare className="size-4" />
          Compose
        </Link>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className={cn("flex-1 overflow-y-auto", pending && "opacity-70")}>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-medium">No conversations</p>
            <p className="text-sm text-muted-foreground">
              Compose a new email or connect Resend to receive inbound mail.
            </p>
            <Link
              href="/inbox/compose"
              className="mt-2 text-sm text-foreground underline-offset-4 hover:underline"
            >
              Compose email
            </Link>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => {
              const preview = c.messages[0];
              const active = !composing && activeId === c.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/inbox/${c.id}`}
                    className={cn(
                      "block border-b border-border/40 px-4 py-3 transition-colors hover:bg-muted/40",
                      active && "bg-muted/60",
                    )}
                  >
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{c.subject}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelative(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.participants.replace(/,/g, ", ")}
                    </p>
                    {preview?.bodyText ? (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">
                        {preview.bodyText}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
