"use client";

import Link from "next/link";
import { useState } from "react";
import {
  planPrice,
  PRICING_PLANS,
  type BillingPeriod,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

export function PricingGrid() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div>
      <div
        className="inline-flex rounded-full border border-[var(--m-line)] bg-[var(--m-surface-strong)] p-1"
        role="radiogroup"
        aria-label="Billing period"
      >
        <BillingOption
          label="Monthly"
          checked={period === "monthly"}
          onSelect={() => setPeriod("monthly")}
        />
        <BillingOption
          label="Yearly"
          checked={period === "yearly"}
          onSelect={() => setPeriod("yearly")}
          badge="2 months free"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const price = planPrice(plan, period);
          const periodLabel = period === "yearly" ? "year" : "month";

          return (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border border-[var(--m-line)] bg-[var(--m-surface-strong)] p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1",
                plan.highlighted && "m-plan-hot bg-[var(--m-paper)]",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="m-display text-2xl font-semibold">{plan.name}</h3>
                {plan.highlighted ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--m-accent-deep)]">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-[var(--m-muted)]">{plan.blurb}</p>

              <p className="mt-6 flex items-end gap-1">
                <span className="m-display text-4xl font-semibold tracking-tight">
                  <data value={String(price)}>${price}</data>
                </span>
                {price > 0 ? (
                  <span className="pb-1 text-sm text-[var(--m-muted)]">
                    / {periodLabel}
                  </span>
                ) : null}
              </p>

              <ul className="mt-6 space-y-2 text-sm text-[var(--m-ink-soft)]">
                <li>
                  <span className="font-semibold text-[var(--m-ink)]">
                    {plan.storage}
                  </span>{" "}
                  persistent storage
                </li>
                <li>{plan.inboxes}</li>
                <li>Managed inbox + provider webhooks</li>
              </ul>

              <Link
                href="/register"
                className={cn(
                  "mt-8 w-full text-center",
                  plan.highlighted ? "m-btn-primary" : "m-btn-secondary",
                )}
              >
                {price === 0 ? "Start free" : "Get started"}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function BillingOption({
  label,
  checked,
  onSelect,
  badge,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        checked
          ? "bg-[var(--m-ink)] text-[var(--m-btn-fg)]"
          : "text-[var(--m-muted)] hover:text-[var(--m-ink)]",
      )}
    >
      {label}
      {badge ? (
        <span
          className={cn(
            "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
            checked
              ? "bg-[var(--m-accent)] text-[#041e49]"
              : "bg-[color-mix(in_srgb,var(--m-accent)_18%,transparent)] text-[var(--m-accent-deep)]",
          )}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}
