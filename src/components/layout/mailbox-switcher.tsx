"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type MailboxOption = {
  id: string;
  email: string;
  displayName: string | null;
};

export function MailboxSwitcher({
  className,
  onChanged,
}: {
  className?: string;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mailboxes, setMailboxes] = useState<MailboxOption[]>([]);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/mailboxes");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setMailboxes(data.mailboxes ?? []);
          setPreferredId(data.preferredMailboxId ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const urlMailbox = searchParams.get("mailbox");
  const selectedId = useMemo(() => {
    if (urlMailbox === "all") return "all";
    if (urlMailbox) {
      const match = mailboxes.find(
        (m) => m.id === urlMailbox || m.email === urlMailbox.toLowerCase(),
      );
      if (match) return match.id;
    }
    if (preferredId && mailboxes.some((m) => m.id === preferredId)) {
      return preferredId;
    }
    return mailboxes[0]?.id ?? "all";
  }, [urlMailbox, mailboxes, preferredId]);

  const selectedLabel = useMemo(() => {
    if (selectedId === "all") return "All mailboxes";
    const m = mailboxes.find((x) => x.id === selectedId);
    return m?.email ?? "Mailbox";
  }, [selectedId, mailboxes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mailboxes;
    return mailboxes.filter(
      (m) =>
        m.email.includes(q) ||
        (m.displayName?.toLowerCase().includes(q) ?? false),
    );
  }, [mailboxes, query]);

  function navigateWithMailbox(mailboxValue: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!mailboxValue || mailboxValue === "all") {
      params.set("mailbox", "all");
    } else {
      params.set("mailbox", mailboxValue);
    }
    params.delete("page");
    const base = pathname.startsWith("/inbox") ? pathname : "/inbox";
    const listBase = base.match(/^\/inbox\/[^/]+/) ? "/inbox" : base;
    const qs = params.toString();
    router.push(qs ? `${listBase}?${qs}` : listBase);
    router.refresh();
    onChanged?.();
  }

  async function selectMailbox(id: string) {
    setOpen(false);
    setQuery("");
    navigateWithMailbox(id === "all" ? "all" : id);
    if (id !== "all") {
      await fetch("/api/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredMailboxId: id }),
      });
      setPreferredId(id);
    }
  }

  if (loading || mailboxes.length === 0) {
    return null;
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-between gap-2 rounded-lg border-border/60 bg-background px-3 text-left text-sm font-normal sm:h-9"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate">
          <span className="text-muted-foreground">Viewing · </span>
          {selectedLabel}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
      </Button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-border/60 bg-popover shadow-md">
          <div className="border-b border-border/50 p-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search addresses…"
              className="h-10 w-full rounded-md border border-border/60 bg-background px-2.5 text-base outline-none focus:ring-2 focus:ring-ring/40 sm:h-8 sm:text-sm"
              autoFocus
            />
          </div>
          <ul className="max-h-[min(16rem,40dvh)] overflow-y-auto py-1" role="listbox">
            <li>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted sm:min-h-9 sm:py-2",
                  selectedId === "all" && "bg-muted/80",
                )}
                onClick={() => void selectMailbox("all")}
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    selectedId === "all" ? "opacity-100" : "opacity-0",
                  )}
                />
                All mailboxes
              </button>
            </li>
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted sm:min-h-9 sm:py-2",
                    selectedId === m.id && "bg-muted/80",
                  )}
                  onClick={() => void selectMailbox(m.id)}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      selectedId === m.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 truncate">{m.email}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground">
                No matching addresses
              </li>
            ) : null}
          </ul>
          <div className="border-t border-border/50 p-1.5">
            <Link
              href="/settings/mailboxes"
              className="flex min-h-10 items-center rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Manage mailboxes…
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
