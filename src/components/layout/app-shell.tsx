"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Inbox, LogOut, Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const nav = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/docs/connect-resend", label: "Docs", icon: BookOpen },
];

function NavLinks({
  username,
  onNavigate,
}: {
  username: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onNavigate?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/60 p-3">
        <p className="mb-2 truncate px-1 text-xs text-muted-foreground">
          {username}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-full justify-start gap-2 text-muted-foreground"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </>
  );
}

function SidebarChrome({
  username,
  className,
}: {
  username: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border/60 px-4">
        <Link href="/inbox" className="text-sm font-semibold tracking-tight">
          Developer Inbox
        </Link>
        <ThemeToggle compact />
      </div>
      <NavLinks username={username} />
    </aside>
  );
}

export function AppShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-3 md:hidden">
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

      <SidebarChrome username={username} className="hidden md:flex" />

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton
          className={cn(
            "fixed inset-y-0 left-0 top-0 z-50 flex h-dvh w-[min(18rem,88vw)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-l-0 border-r bg-sidebar p-0 text-sidebar-foreground shadow-lg ring-0 sm:max-w-none",
            "data-open:slide-in-from-left data-closed:slide-out-to-left data-open:zoom-in-100 data-closed:zoom-out-100",
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Navigation</DialogTitle>
          </DialogHeader>
          <div className="flex h-14 items-center border-b border-border/60 px-4">
            <span className="text-sm font-semibold tracking-tight">
              Developer Inbox
            </span>
          </div>
          <NavLinks username={username} onNavigate={() => setMenuOpen(false)} />
        </DialogContent>
      </Dialog>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
