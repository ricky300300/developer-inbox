export type BillingPeriod = "monthly" | "yearly";

export type PricingPlan = {
  id: string;
  name: string;
  storage: string;
  storageGb: number;
  inboxes: string;
  priceMonthly: number;
  priceYearly: number;
  blurb: string;
  highlighted?: boolean;
};

/** Storage-led plans. Paid plans include unlimited inboxes. Prices are USD. */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    storage: "1 GB",
    storageGb: 1,
    inboxes: "1 inbox",
    priceMonthly: 0,
    priceYearly: 0,
    blurb: "One inbox to try the product and keep a working archive.",
  },
  {
    id: "small-group",
    name: "Small group",
    storage: "10 GB",
    storageGb: 10,
    inboxes: "Unlimited inboxes",
    priceMonthly: 5,
    priceYearly: 50,
    blurb: "A few people sharing support and product mail.",
    highlighted: true,
  },
  {
    id: "team",
    name: "Team",
    storage: "100 GB",
    storageGb: 100,
    inboxes: "Unlimited inboxes",
    priceMonthly: 25,
    priceYearly: 250,
    blurb: "A shared inbox with room for a heavier archive.",
  },
];

export function planPrice(plan: PricingPlan, period: BillingPeriod): number {
  return period === "yearly" ? plan.priceYearly : plan.priceMonthly;
}
