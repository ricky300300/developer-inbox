import Link from "next/link";
import { PRICING_PLANS } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

type PricingGridProps = {
  compact?: boolean;
};

export function PricingGrid({ compact = false }: PricingGridProps) {
  const plans = compact
    ? PRICING_PLANS.filter((p) =>
        ["starter", "team", "business", "unlimited"].includes(p.id),
      )
    : PRICING_PLANS;

  return (
    <div
      className={cn(
        "grid gap-4",
        compact
          ? "md:grid-cols-2 xl:grid-cols-4"
          : "sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {plans.map((plan) => (
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
              {plan.priceMonthly == null ? "Custom" : `$${plan.priceMonthly}`}
            </span>
            {plan.priceMonthly != null ? (
              <span className="pb-1 text-sm text-[var(--m-muted)]">/ month</span>
            ) : null}
          </p>

          <ul className="mt-6 space-y-2 text-sm text-[var(--m-ink-soft)]">
            <li>
              <span className="font-semibold text-[var(--m-ink)]">
                {plan.storage}
              </span>{" "}
              persistent storage
            </li>
            <li>{plan.addresses}</li>
            <li>{plan.seats}</li>
            <li>Managed inbox + provider webhooks</li>
          </ul>

          <Link
            href="/register"
            className={cn(
              "mt-8 w-full text-center",
              plan.highlighted ? "m-btn-primary" : "m-btn-secondary",
            )}
          >
            Get started
          </Link>
        </article>
      ))}
    </div>
  );
}
