import type { Metadata } from "next";
import Link from "next/link";
import { FaqSection } from "@/components/marketing/faq-section";
import { FeatureSections } from "@/components/marketing/feature-sections";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { InboxVisual } from "@/components/marketing/inbox-visual";
import { PricingGrid } from "@/components/marketing/pricing-grid";

export const metadata: Metadata = {
  description:
    "Developer Inbox is the conversation layer for Resend. Free includes 1 GB and one inbox. Small group is $5/month or $50/year for 10 GB. Team is $25/month or $250/year for 100 GB. Paid plans include unlimited inboxes.",
};

export default function MarketingHomePage() {
  return (
    <>
      <section className="m-atmosphere relative overflow-hidden">
        <div className="m-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-12 sm:gap-10 sm:px-6 sm:py-16 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-10 lg:py-20 xl:max-w-[88rem] xl:gap-14">
          <div className="flex flex-col justify-center">
            <p className="m-display m-animate-in text-4xl font-semibold tracking-tight text-[var(--m-ink)] sm:text-5xl lg:text-[3.35rem]">
              Developer Inbox
            </p>
            <h1 className="m-animate-in m-animate-in-delay-1 mt-5 max-w-xl text-2xl font-medium leading-snug text-[var(--m-ink-soft)] sm:text-3xl">
              The conversation layer for API-first email
            </h1>
            <p className="m-animate-in m-animate-in-delay-2 mt-4 max-w-md text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
              Connect Resend, manage mailboxes with your team, and keep every
              thread and attachment persistent.
            </p>
            <div className="m-animate-in m-animate-in-delay-3 mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="m-btn-primary">
                Start free
              </Link>
              <Link href="/pricing" className="m-btn-secondary">
                View pricing
              </Link>
            </div>
          </div>

          <div className="m-animate-in m-animate-in-delay-2 w-full min-w-0 lg:justify-self-end">
            <InboxVisual />
          </div>
        </div>
      </section>

      <FeatureSections />

      <HowItWorks />

      <section
        id="pricing"
        aria-labelledby="pricing-heading"
        className="border-y border-[var(--m-line)] bg-[var(--m-surface)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
              Pricing
            </p>
            <h2
              id="pricing-heading"
              className="m-display mt-3 text-3xl font-semibold sm:text-4xl"
            >
              Storage that scales with your mail
            </h2>
            <p className="mt-4 text-base text-[var(--m-muted)] sm:text-lg">
              Start free with 1 GB and one inbox. Small group is $5 per month
              or $50 per year for 10 GB and unlimited inboxes. Team is $25 per
              month or $250 per year for 100 GB.
            </p>
          </div>
          <div className="mt-12">
            <PricingGrid />
          </div>
          <p className="mt-8 text-sm text-[var(--m-muted)]">
            <Link
              href="/pricing"
              className="font-semibold text-[var(--m-accent-deep)] underline-offset-4 hover:underline"
            >
              See what’s included
            </Link>
          </p>
        </div>
      </section>

      <FaqSection />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0b1f2a] px-6 py-14 text-[#f6fafb] sm:px-12 dark:bg-[#050a0d]">
          <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[var(--m-accent)] opacity-30 blur-3xl" />
          <div className="relative max-w-xl">
            <h2 className="m-display text-3xl font-semibold sm:text-4xl">
              Ship the inbox your API already implies
            </h2>
            <p className="mt-4 text-base text-[#f6fafb]/70">
              Create an account, connect a provider, and put your team on a
              managed inbox in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-[var(--m-accent)] px-5 py-3 text-sm font-semibold text-[#041e49] transition hover:bg-[var(--m-accent-deep)] dark:text-[#0b141a]"
              >
                Sign up
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-[#f6fafb]/20 px-5 py-3 text-sm font-semibold text-[#f6fafb]/90 transition hover:bg-[#f6fafb]/10"
              >
                About us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
