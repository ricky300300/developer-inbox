import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Setup and configuration guides for Developer Inbox — connect Resend, mailboxes, and webhooks.",
};

const GUIDES = [
  {
    href: "/docs/connect-resend",
    title: "Connect Resend",
    body: "API keys, domains, webhooks, Connection settings, and mailboxes — end to end.",
  },
];

export default function DocsIndexPage() {
  return (
    <div className="m-atmosphere">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
          Docs
        </p>
        <h1 className="m-display m-animate-in mt-4 text-4xl font-semibold sm:text-5xl">
          Setup & configuration
        </h1>
        <p className="m-animate-in m-animate-in-delay-1 mt-5 text-lg text-[var(--m-muted)]">
          Guides for connecting providers and getting inbound mail into your
          inbox. No account required to read these.
        </p>

        <ul className="mt-12 space-y-4">
          {GUIDES.map((guide) => (
            <li key={guide.href}>
              <Link
                href={guide.href}
                className="block rounded-2xl border border-[var(--m-line)] bg-[var(--m-surface-strong)] p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="m-display text-xl font-semibold text-[var(--m-ink)]">
                  {guide.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--m-muted)]">{guide.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
