import type { Metadata } from "next";
import Link from "next/link";
import { PricingGrid } from "@/components/marketing/pricing-grid";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Developer Inbox pricing — 10 GB from $5/month through unlimited storage, addresses, and seats.",
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
            Persistent capacity, clear monthly pricing
          </h1>
          <p className="m-animate-in m-animate-in-delay-1 mt-5 text-lg text-[var(--m-muted)]">
            Plans scale storage, mailbox addresses, and team seats together.
            Start at $5 for 10 GB — grow to unlimited when volume demands it.
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
    </div>
  );
}
