const FEATURES = [
  {
    title: "Conversation inbox",
    body: "Threaded support-style inbox for inbound and outbound mail — search, unread, and reply without leaving the product.",
  },
  {
    title: "Resend & more providers",
    body: "Connect Resend today with encrypted credentials and signed webhooks. The adapter pattern is ready for SES, Mailgun, Postmark, and others.",
  },
  {
    title: "Managed inbox",
    body: "We sit on top of your email API — you keep the provider; we give your team a durable place to read, reply, and archive.",
  },
  {
    title: "Multiple addresses",
    body: "Create and switch mailboxes on a connection. Filter Inbox and Sent per address so each brand or product line stays clear.",
  },
  {
    title: "Team access",
    body: "Grant teammates mailbox access with roles suited to operators and members — shared queues without shared API keys.",
  },
  {
    title: "Storage that sticks",
    body: "Conversations, attachments, and mailbox history persist with plan-based storage — 1 GB free, 10 GB, or 100 GB.",
  },
];

export function FeatureSections() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
          What you get
        </p>
        <h2 className="m-display mt-3 text-3xl font-semibold sm:text-4xl">
          Inbox infrastructure for API-first email
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
          One product surface for providers, mailboxes, teams, and durable
          storage — without rebuilding a mail client in-house.
        </p>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            className="m-animate-in border-t border-[var(--m-line)] pt-6"
            style={{ animationDelay: `${0.05 * index}s` }}
          >
            <h3 className="m-display text-xl font-semibold">{feature.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)] sm:text-[0.95rem]">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
