import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Developer Inbox exists — a managed conversation layer for API-first email providers.",
};

export default function AboutPage() {
  return (
    <div className="m-atmosphere">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
          About us
        </p>
        <h1 className="m-display m-animate-in mt-4 text-4xl font-semibold sm:text-5xl">
          We build the inbox that sits on your email API
        </h1>
        <p className="m-animate-in m-animate-in-delay-1 mt-6 text-lg leading-relaxed text-[var(--m-muted)]">
          Developer Inbox is for teams who already send and receive mail through
          providers like Resend — and still need a real place for humans to
          triage, reply, and keep history.
        </p>

        <div className="mt-14 space-y-10 text-base leading-relaxed text-[var(--m-ink-soft)]">
          <section>
            <h2 className="m-display text-2xl font-semibold text-[var(--m-ink)]">
              The problem
            </h2>
            <p className="mt-3">
              API-first email is excellent for delivery and domains. It is a
              poor day-to-day inbox. Support threads, product mailboxes, and
              ops aliases end up scattered across dashboards, personal clients,
              or one-off scripts.
            </p>
          </section>

          <section>
            <h2 className="m-display text-2xl font-semibold text-[var(--m-ink)]">
              What we provide
            </h2>
            <p className="mt-3">
              A managed conversation inbox with provider integrations, multiple
              address creation, team grants, attachment storage, and persistent
              archives sized to your plan. You keep the provider relationship;
              we give your team the workflow layer.
            </p>
          </section>

          <section>
            <h2 className="m-display text-2xl font-semibold text-[var(--m-ink)]">
              How we work
            </h2>
            <p className="mt-3">
              Credentials stay encrypted at rest. Inbound arrives over signed
              webhooks. Outbound replies go out through your connected provider.
              Storage plans — 1 GB free, 10 GB, and 100 GB — keep threads and
              files available when you need them.
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/register" className="m-btn-primary">
            Create an account
          </Link>
          <Link href="/pricing" className="m-btn-secondary">
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
