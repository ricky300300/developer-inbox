import type { Metadata } from "next";
import Link from "next/link";
import { FaqSection } from "@/components/marketing/faq-section";
import { PricingGrid } from "@/components/marketing/pricing-grid";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Developer Inbox pricing: free with 1 GB and one inbox, Small group at $5/month or $50/year for 10 GB, and Team at $25/month or $250/year for 100 GB. Paid plans include unlimited inboxes.",
};

export default function PricingPage() {
  return (
    <div className="m-atmosphere">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
            Pricing
          </p>
          <h1 className="m-display m-animate-in mt-4 text-4xl font-semibold sm:text-5xl">
            Persistent capacity, monthly or yearly
          </h1>
          <p className="m-animate-in m-animate-in-delay-1 mt-5 text-lg text-[var(--m-muted)]">
            Paid plans include unlimited inboxes. Free is 1 GB and one inbox.
            Small group is 10 GB for $5/month or $50/year. Team is 100 GB for
            $25/month or $250/year.
          </p>
        </div>

        <div className="mt-14">
          <PricingGrid />
        </div>

        <div className="mt-16 max-w-2xl border-t border-[var(--m-line)] pt-10">
          <h2 className="m-display text-2xl font-semibold">What’s included</h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
            <li>Conversation inbox with reply and compose</li>
            <li>Resend integration (more providers on the roadmap)</li>
            <li>Encrypted API keys and webhook secrets</li>
            <li>One inbox on Free, unlimited inboxes on paid plans</li>
            <li>Multi-mailbox switching and team grants</li>
            <li>Persistent message and attachment storage per plan</li>
          </ul>
          <p className="mt-8 text-sm text-[var(--m-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[var(--m-accent-deep)] underline-offset-4 hover:underline"
            >
              Log in
            </Link>{" "}
            or{" "}
            <Link
              href="/register"
              className="font-semibold text-[var(--m-accent-deep)] underline-offset-4 hover:underline"
            >
              sign up
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
      <FaqSection />
    </div>
  );
}
