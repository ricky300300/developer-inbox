import Link from "next/link";

const STEPS = [
  {
    title: "Connect your provider",
    body: "Add a Resend API key and the webhook signing secret in Settings. Mail still sends and receives through Resend.",
  },
  {
    title: "Add the addresses you use",
    body: "Create mailboxes for the addresses you want in the inbox, then switch among them from the sidebar.",
  },
  {
    title: "Work the thread",
    body: "Inbound mail shows up as a conversation. Reply or compose, and it goes out through your provider.",
  },
  {
    title: "Leave the history in place",
    body: "Messages and attachments stay in your plan’s storage until you delete them.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[var(--m-line)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--m-accent-deep)]">
            How it works
          </p>
          <h2 className="m-display mt-3 text-3xl font-semibold sm:text-4xl">
            From a Resend webhook to a shared inbox
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
            You keep the email API. Developer Inbox is the place your team
            reads, replies, and keeps the thread.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col rounded-2xl border border-[var(--m-line)] bg-[var(--m-surface-strong)] p-6"
            >
              <span className="m-display text-sm font-semibold tracking-[0.14em] text-[var(--m-accent-deep)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="m-display mt-4 text-xl font-semibold">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--m-muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-[var(--m-muted)]">
          <Link
            href="/docs/connect-resend"
            className="font-semibold text-[var(--m-accent-deep)] underline-offset-4 hover:underline"
          >
            Follow the Resend setup guide
          </Link>
        </p>
      </div>
    </section>
  );
}
