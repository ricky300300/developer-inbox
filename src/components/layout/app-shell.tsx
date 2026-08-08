"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Inbox,
  LogOut,
  Menu,
  Search,
  Send,
  Settings,
  SquarePen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ComposeProvider,
  useCompose,
} from "@/components/compose/compose-provider";

type Counts = {
  inbox: number;
  sent: number;
};

function NavContent({
  username,
  counts,
  onNavigate,
}: {
  username: string;
  counts: Counts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openCompose } = useCompose();
  const folder = searchParams.get("folder");
  const onInbox = pathname.startsWith("/inbox") && folder !== "sent";
  const onSent = pathname.startsWith("/inbox") && folder === "sent";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onNavigate?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="p-3">
        <Button
          type="button"
          onClick={() => {
            openCompose();
            onNavigate?.();
          }}
          className="h-14 w-full cursor-pointer justify-start gap-3 rounded-2xl bg-[#c2e7ff] px-5 text-base font-medium text-[#001d35] shadow-none hover:bg-[#c2e7ff] hover:shadow-md dark:bg-[#004a77]/40 dark:text-[#c2e7ff] dark:hover:bg-[#004a77]/40 dark:hover:shadow-md"
        >
          <SquarePen className="size-5 shrink-0 text-[#001d35] dark:text-[#a8c7fa]" />
          Compose
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 pr-3">
        <Link
          href="/inbox"
          onClick={onNavigate}
          className={cn(
            "flex min-h-9 items-center gap-3 rounded-r-full py-2 pr-4 pl-4 text-sm transition-colors",
            onInbox
              ? "bg-[#d3e3fd] font-semibold text-[#041e49] dark:bg-[#004a77]/40 dark:text-[#c2e7ff]"
              : "text-foreground/80 hover:bg-[#e8f0fe] hover:text-[#041e49] dark:hover:bg-[#004a77]/25 dark:hover:text-[#c2e7ff]",
          )}
        >
          <Inbox className="size-4 shrink-0" />
          <span className="flex-1">Inbox</span>
          {counts.inbox > 0 ? (
            <span className="text-xs tabular-nums">{counts.inbox}</span>
          ) : null}
        </Link>
        <Link
          href="/inbox?folder=sent"
          onClick={onNavigate}
          className={cn(
            "flex min-h-9 items-center gap-3 rounded-r-full py-2 pr-4 pl-4 text-sm transition-colors",
            onSent
              ? "bg-[#d3e3fd] font-semibold text-[#041e49] dark:bg-[#004a77]/40 dark:text-[#c2e7ff]"
              : "text-foreground/80 hover:bg-[#e8f0fe] hover:text-[#041e49] dark:hover:bg-[#004a77]/25 dark:hover:text-[#c2e7ff]",
          )}
        >
          <Send className="size-4 shrink-0" />
          <span className="flex-1">Sent</span>
          {counts.sent > 0 ? (
            <span className="text-xs tabular-nums">{counts.sent}</span>
          ) : null}
        </Link>
      </nav>

      <div className="mt-auto space-y-1 border-t border-border/50 p-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[#d3e3fd] font-semibold text-[#041e49] dark:bg-[#004a77]/40 dark:text-[#c2e7ff]"
              : "text-muted-foreground hover:bg-[#e8f0fe] hover:text-[#041e49] dark:hover:bg-[#004a77]/25 dark:hover:text-[#c2e7ff]",
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
        <Link
          href="/docs/connect-resend"
          onClick={onNavigate}
          className={cn(
            "flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/docs")
              ? "bg-[#d3e3fd] font-semibold text-[#041e49] dark:bg-[#004a77]/40 dark:text-[#c2e7ff]"
              : "text-muted-foreground hover:bg-[#e8f0fe] hover:text-[#041e49] dark:hover:bg-[#004a77]/25 dark:hover:text-[#c2e7ff]",
          )}
        >
          <BookOpen className="size-4 shrink-0" />
          Docs
        </Link>
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {username}
          </p>
          <ThemeToggle compact />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-start gap-2 text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}

function MailSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const query = searchParams.get("q") ?? "";
  const folder = searchParams.get("folder");
  const [search, setSearch] = useState(query);
  const focusedRef = useRef(false);

  // Sync from URL only when the field isn't focused (back/forward, nav links).
  // Avoids resetting the input while results load after typing.
  useEffect(() => {
    if (focusedRef.current) return;
    setSearch(query);
  }, [query]);

  useEffect(() => {
    if (!pathname.startsWith("/inbox")) return;
    const handle = setTimeout(() => {
      const next = search.trim();
      const current = query.trim();
      if (next === current) return;
      startTransition(() => {
        const params = new URLSearchParams();
        if (folder === "sent") params.set("folder", "sent");
        if (next) params.set("q", next);
        // New search always starts at page 1
        const qs = params.toString();
        // Keep thread routes on list when searching
        router.replace(qs ? `/inbox?${qs}` : "/inbox");
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [search, query, router, folder, pathname, startTransition]);

  if (!pathname.startsWith("/inbox")) return <div className="flex-1" />;

  return (
    <div className="relative w-full max-w-3xl">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-[1.15rem] -translate-y-1/2 text-[#444746] dark:text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
        }}
        placeholder="Search mail"
        className="h-12 rounded-full border border-solid border-[#e6e6e6] bg-[#f2f6fc] pl-12 text-[0.9375rem] text-[#041e49] shadow-none placeholder:text-[#444746] transition-none focus:bg-white focus:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] focus-visible:border-[#e6e6e6] focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-muted dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:bg-card dark:focus-visible:bg-card"
      />
    </div>
  );
}

function AppShellInner({
  username,
  counts,
  children,
}: {
  username: string;
  counts: Counts;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f9f9f9] dark:bg-background md:flex-row">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 px-3 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 shrink-0"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <Link
          href="/inbox"
          className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight"
        >
          Developer Inbox
        </Link>
        <ThemeToggle compact />
      </header>

      <aside className="hidden w-[15.5rem] shrink-0 flex-col md:flex">
        <div className="flex h-16 items-center px-4">
          <Link
            href="/inbox"
            className="text-[1.05rem] font-semibold tracking-tight"
          >
            Developer Inbox
          </Link>
        </div>
        <NavContent username={username} counts={counts} />
      </aside>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton
          className={cn(
            "fixed inset-y-0 left-0 top-0 z-50 flex h-dvh w-[min(18rem,88vw)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-l-0 border-r bg-[#f9f9f9] p-0 shadow-lg ring-0 sm:max-w-none dark:bg-background",
            "data-open:slide-in-from-left data-closed:slide-out-to-left data-open:zoom-in-100 data-closed:zoom-out-100",
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Navigation</DialogTitle>
          </DialogHeader>
          <div className="flex h-14 items-center border-b border-border/40 px-4">
            <span className="text-sm font-semibold tracking-tight">
              Developer Inbox
            </span>
          </div>
          <NavContent
            username={username}
            counts={counts}
            onNavigate={() => setMenuOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-3 pb-2 md:px-4 md:py-3">
          <MailSearch />
        </div>
        <main className="mx-2 mb-2 min-h-0 min-w-0 flex-1 overflow-hidden rounded-sm bg-card shadow-sm ring-1 ring-black/[0.06] dark:ring-white/[0.08] md:mx-0 md:mb-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({
  username,
  counts,
  children,
}: {
  username: string;
  counts: Counts;
  children: React.ReactNode;
}) {
  return (
    <ComposeProvider>
      <AppShellInner username={username} counts={counts}>
        {children}
      </AppShellInner>
    </ComposeProvider>
  );
}
