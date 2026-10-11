import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarkdownDoc } from "@/components/docs/markdown-doc";

export const metadata: Metadata = {
  title: "Connect Resend",
  description:
    "How to connect Resend to Developer Inbox — API keys, domains, webhooks, and mailboxes.",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default async function ConnectResendDocsPage() {
  const md = await readFile(
    path.join(process.cwd(), "docs/connect-resend.md"),
    "utf8",
  );

  const titleMatch = md.match(/^#\s+(.+)\s*$/m);
  const title = titleMatch?.[1] ?? "Connect Resend";
  const body = md.replace(/^#\s+.+\s*\n+/, "");
  const toc = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => ({
    label: match[1].trim(),
    href: `#${slugify(match[1].trim())}`,
  }));

  return (
    <div className="m-atmosphere">
      <div className="border-b border-[var(--m-line)] bg-[var(--m-surface)]/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--m-muted)] transition-colors hover:text-[var(--m-ink)]"
          >
            <ArrowLeft className="size-3.5" />
            All docs
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
            Setup guide
          </p>
          <h1 className="m-display m-animate-in mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="m-animate-in m-animate-in-delay-1 mt-4 max-w-2xl text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
            Walk through API keys, domains, webhooks, and mailbox settings so
            inbound Resend mail shows up in Developer Inbox.
          </p>
          <div className="m-animate-in m-animate-in-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="m-btn-primary !py-2.5 !text-sm">
              Create an account
            </Link>
            <Link href="/login" className="m-btn-secondary !py-2.5 !text-sm">
              Log in to Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-14 lg:py-14">
        <div className="min-w-0">
          <MarkdownDoc source={body} />
        </div>

        {toc.length > 0 ? (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-[var(--m-line)] bg-[var(--m-surface-strong)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--m-muted)]">
                On this page
              </p>
              <nav className="mt-4 flex flex-col gap-2" aria-label="Table of contents">
                {toc.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm leading-snug text-[var(--m-muted)] transition-colors hover:text-[var(--m-ink)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        ) : null}
      </div>

      <div className="border-t border-[var(--m-line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="m-display text-xl font-semibold">Ready to connect?</p>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Sign in and open Settings → Connection to paste your Resend key.
            </p>
          </div>
          <Link
            href="/register"
            className="m-btn-primary inline-flex !py-2.5 !text-sm"
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
