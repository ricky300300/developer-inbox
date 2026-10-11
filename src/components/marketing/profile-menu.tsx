"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, LogOut, Settings, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  username: string;
  className?: string;
};

export function ProfileMenu({ username, className }: ProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initial = username.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--m-line)] bg-[var(--m-surface-strong)] text-sm font-semibold text-[var(--m-ink)] outline-none transition hover:bg-[var(--m-surface)] focus-visible:ring-2 focus-visible:ring-[var(--m-accent)]"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        {initial}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] min-w-56 overflow-hidden rounded-xl border border-[var(--m-line)] bg-[var(--m-panel)] p-1.5 text-[var(--m-ink)] shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
        >
          <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-[var(--m-muted)]">
            <UserRound className="size-3.5 shrink-0" />
            <span className="truncate font-medium text-[var(--m-ink)]">
              {username}
            </span>
          </div>

          <div className="my-1 h-px bg-[var(--m-line)]" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--m-ink)] transition hover:bg-[var(--m-mist)]"
            onClick={() => go("/inbox")}
          >
            <Inbox className="size-4 shrink-0" />
            Open inbox
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--m-ink)] transition hover:bg-[var(--m-mist)]"
            onClick={() => go("/settings")}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </button>

          <div className="my-1 h-px bg-[var(--m-line)]" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
            onClick={signOut}
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
