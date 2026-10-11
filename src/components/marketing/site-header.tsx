"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ProfileMenu } from "@/components/marketing/profile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
];

type SiteHeaderProps = {
  isLoggedIn: boolean;
  username?: string | null;
};

export function SiteHeader({ isLoggedIn, username }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--m-line)] bg-[color-mix(in_srgb,var(--m-paper)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-[var(--m-ink)]"
          onClick={() => setOpen(false)}
        >
          <Logo decorative className="size-7 shrink-0" />
          <span className="m-display text-xl font-semibold tracking-tight">
            Developer Inbox
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  active
                    ? "text-[var(--m-ink)]"
                    : "text-[var(--m-muted)] hover:text-[var(--m-ink)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle
            compact
            className="size-9 text-[var(--m-muted)] hover:bg-[var(--m-surface)] hover:text-[var(--m-ink)]"
          />
          {isLoggedIn && username ? (
            <>
              <Link href="/inbox" className="m-btn-primary !px-4 !py-2 text-sm">
                Open inbox
              </Link>
              <ProfileMenu username={username} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--m-muted)] transition-colors hover:text-[var(--m-ink)]"
              >
                Log in
              </Link>
              <Link href="/register" className="m-btn-primary !px-4 !py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle
            compact
            className="size-10 rounded-full border border-[var(--m-line)] bg-[var(--m-surface)] text-[var(--m-ink)] hover:bg-[var(--m-surface-strong)]"
          />
          {isLoggedIn && username ? (
            <ProfileMenu
              username={username}
              className="size-10"
            />
          ) : null}
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--m-line)] bg-[var(--m-surface)] text-[var(--m-ink)]"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-[var(--m-line)] bg-[var(--m-paper)] px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-3 text-base font-medium text-[var(--m-ink)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[var(--m-line)] pt-4">
            {isLoggedIn && username ? (
              <>
                <p className="px-1 text-sm text-[var(--m-muted)]">
                  Signed in as{" "}
                  <span className="font-semibold text-[var(--m-ink)]">
                    {username}
                  </span>
                </p>
                <Link
                  href="/inbox"
                  className="m-btn-primary w-full"
                  onClick={() => setOpen(false)}
                >
                  Open inbox
                </Link>
                <Link
                  href="/settings"
                  className="m-btn-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="m-btn-secondary w-full text-[var(--m-muted)]"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="m-btn-secondary w-full"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="m-btn-primary w-full"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
