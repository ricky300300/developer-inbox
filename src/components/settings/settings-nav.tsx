"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, Inbox, KeyRound, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  {
    href: "/settings",
    label: "Overview",
    shortLabel: "Home",
    icon: Inbox,
    exact: true,
  },
  {
    href: "/settings/connection",
    label: "Connection",
    shortLabel: "Connect",
    icon: KeyRound,
  },
  {
    href: "/settings/mailboxes",
    label: "Mailboxes",
    shortLabel: "Boxes",
    icon: Mail,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href="/inbox"
            className="mb-1.5 inline-flex min-h-9 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to inbox
          </Link>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Settings
          </h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
            Connect your email provider and manage mailbox addresses.
          </p>
        </div>
        <Link
          href="/docs/connect-resend"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-9 sm:px-3"
          aria-label="Setup guide"
        >
          <BookOpen className="size-3.5" />
          <span className="hidden sm:inline">Setup guide</span>
        </Link>
      </div>

      <nav
        className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1"
        aria-label="Settings sections"
      >
        {links.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-10 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center text-[0.7rem] font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
