export type PricingPlan = {
  id: string;
  name: string;
  storage: string;
  storageGb: number | null;
  addresses: string;
  seats: string;
  priceMonthly: number | null;
  blurb: string;
  highlighted?: boolean;
};

/** Storage-led plans with mailbox/team allowances. Prices are USD / month. */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    storage: "10 GB",
    storageGb: 10,
    addresses: "5 addresses",
    seats: "1 seat",
    priceMonthly: 5,
    blurb: "Solo builders wiring their first provider inbox.",
  },
  {
    id: "plus",
    name: "Plus",
    storage: "20 GB",
    storageGb: 20,
    addresses: "15 addresses",
    seats: "3 seats",
    priceMonthly: 12,
    blurb: "Small teams shipping support and product mail.",
  },
  {
    id: "team",
    name: "Team",
    storage: "100 GB",
    storageGb: 100,
    addresses: "100 addresses",
    seats: "10 seats",
    priceMonthly: 29,
    blurb: "Shared inboxes with room to grow mailboxes.",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    storage: "1 TB",
    storageGb: 1000,
    addresses: "1,000 addresses",
    seats: "25 seats",
    priceMonthly: 79,
    blurb: "High-volume domains and persistent archives.",
  },
  {
    id: "scale",
    name: "Scale",
    storage: "5 TB",
    storageGb: 5000,
    addresses: "5,000 addresses",
    seats: "100 seats",
    priceMonthly: 199,
    blurb: "Multi-brand ops with heavy attachment traffic.",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    storage: "Unlimited",
    storageGb: null,
    addresses: "Unlimited addresses",
    seats: "Unlimited seats",
    priceMonthly: 449,
    blurb: "Custom limits removed — talk to us for SLAs.",
  },
];
