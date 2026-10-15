import Link from "next/link";
import { FAQS } from "@/lib/marketing/faq";
import { PRICING_PLANS } from "@/lib/marketing/pricing";

function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Developer Inbox",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Conversation inbox for API-first email. Connect Resend, share mailboxes, and keep threads and attachments in plan storage.",
        offers: PRICING_PLANS.flatMap((plan) => {
          const description = `${plan.storage} persistent storage. ${plan.inboxes}.`;
          if (plan.priceMonthly === 0) {
            return [
              {
                "@type": "Offer",
                name: plan.name,
                price: "0",
                priceCurrency: "USD",
                description,
              },
            ];
          }
          return [
            {
              "@type": "Offer",
              name: `${plan.name} monthly`,
              price: String(plan.priceMonthly),
              priceCurrency: "USD",
              description,
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: String(plan.priceMonthly),
                priceCurrency: "USD",
                unitText: "MONTH",
              },
            },
            {
              "@type": "Offer",
              name: `${plan.name} yearly`,
              price: String(plan.priceYearly),
              priceCurrency: "USD",
              description,
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: String(plan.priceYearly),
                priceCurrency: "USD",
                unitText: "YEAR",
              },
            },
          ];
        }),
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData()),
        }}
      />
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
          FAQ
        </p>
        <h2
          id="faq-heading"
          className="m-display mt-3 text-3xl font-semibold sm:text-4xl"
        >
          Frequently asked questions
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
          What Developer Inbox is, what each plan includes, and how yearly
          billing works.
        </p>
      </div>

      <dl className="mt-12 max-w-3xl divide-y divide-[var(--m-line)] border-y border-[var(--m-line)]">
        {FAQS.map((faq) => (
          <div key={faq.question} className="py-6">
            <dt>
              <h3 className="m-display text-xl font-semibold">{faq.question}</h3>
            </dt>
            <dd className="mt-3 text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              {faq.answer}{" "}
              {faq.question === "How do I connect Resend?" ? (
                <Link
                  href="/docs/connect-resend"
                  className="font-semibold text-[var(--m-accent-deep)] underline-offset-4 hover:underline"
                >
                  Open the Connect Resend guide
                </Link>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
