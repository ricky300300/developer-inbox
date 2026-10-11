import {
  Inbox,
  Search,
  Send,
  Settings,
  SquarePen,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marketing hero preview — mirrors the real AppShell + inbox list layout.
 * Follows the shared html.dark / light theme from next-themes.
 */
export function InboxVisual() {
  const rows = [
    {
      from: "Maya Chen",
      subject: "Billing retry failed",
      preview: "Hard fail on invoice #4821 — can we surface the Resend event?",
      time: "2:14 PM",
      unread: true,
      active: true,
    },
    {
      from: "Resend",
      subject: "Webhook signed",
      preview: "email.received is active for support@acme.dev",
      time: "11:02 AM",
      unread: true,
      active: false,
    },
    {
      from: "Team · Ops",
      subject: "Seat invite accepted",
      preview: "Jordan joined the support mailbox",
      time: "Yesterday",
      unread: false,
      active: false,
    },
    {
      from: "you",
      subject: "Re: Domain verification",
      preview: "DNS looks good — inbound should start flowing shortly.",
      time: "Mon",
      unread: false,
      active: false,
    },
  ];

  return (
    <div className="m-float w-full max-w-full" aria-hidden>
      <div className="flex h-[min(52vh,22rem)] w-full flex-col overflow-hidden rounded-xl border border-[#c5d0da] bg-white shadow-[0_16px_40px_-24px_rgba(11,31,42,0.28)] sm:h-[min(56vh,26rem)] md:h-[min(58vh,30rem)] lg:h-[min(70vh,36rem)] xl:h-[min(72vh,40rem)] dark:border-white/10 dark:bg-[#0f1419] dark:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.55)]">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#e2e8f0] bg-white px-3 py-2 sm:px-3.5 sm:py-2.5 dark:border-white/10 dark:bg-[#0f1419]">
          <span className="size-2 rounded-full bg-[#ff5f57] sm:size-2.5" />
          <span className="size-2 rounded-full bg-[#febc2e] sm:size-2.5" />
          <span className="size-2 rounded-full bg-[#28c840] sm:size-2.5" />
          <span className="ml-1.5 truncate text-[10px] font-medium text-[#5f6b76] sm:ml-2 sm:text-[11px] dark:text-white/50">
            Developer Inbox · support@acme.dev
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[2.75rem_1fr] sm:grid-cols-[8.5rem_1fr] md:grid-cols-[9.5rem_1fr] lg:grid-cols-[10.5rem_1fr]">
          <aside className="flex min-h-0 flex-col border-r border-[#e2e8f0] bg-[#f0f4f8] px-1 py-2 sm:px-2.5 md:px-3 dark:border-white/10 dark:bg-[#0b1014]">
            <div className="mb-2 flex h-8 items-center justify-center gap-1.5 rounded-2xl bg-[#c2e7ff] text-[#001d35] sm:h-10 sm:justify-start sm:px-3 lg:h-11 lg:px-3.5 dark:bg-[#004a77]/40 dark:text-[#c2e7ff]">
              <SquarePen className="size-3.5 shrink-0 sm:size-4" />
              <span className="hidden text-xs font-semibold sm:inline">
                Compose
              </span>
            </div>

            <div className="mb-2 hidden rounded-lg border border-[#d8e0e8] bg-white px-2 py-1.5 sm:block md:px-2.5 md:py-2 dark:border-white/10 dark:bg-white/5">
              <p className="truncate text-[9px] font-medium uppercase tracking-wide text-[#7a8692] dark:text-white/45">
                Mailbox
              </p>
              <p className="truncate text-[11px] font-semibold text-[#041e49] md:text-xs dark:text-[#c2e7ff]">
                support@acme.dev
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-2 rounded-r-full bg-[#d3e3fd] py-1.5 text-[#041e49] sm:justify-start sm:py-2 sm:pr-3 sm:pl-2.5 dark:bg-[#004a77]/40 dark:text-[#c2e7ff]">
                <Inbox className="size-3.5 shrink-0 sm:size-4" />
                <span className="hidden flex-1 text-xs font-semibold sm:inline">
                  Inbox
                </span>
                <span className="hidden text-[11px] tabular-nums sm:inline">
                  12
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-r-full py-1.5 text-[#3c4a57] sm:justify-start sm:py-2 sm:pr-3 sm:pl-2.5 dark:text-white/70">
                <Send className="size-3.5 shrink-0 opacity-70 sm:size-4" />
                <span className="hidden flex-1 text-xs sm:inline">Sent</span>
                <span className="hidden text-[11px] tabular-nums opacity-60 sm:inline">
                  4
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-r-full py-1.5 text-[#3c4a57] sm:justify-start sm:py-2 sm:pr-3 sm:pl-2.5 dark:text-white/70">
                <Trash2 className="size-3.5 shrink-0 opacity-70 sm:size-4" />
                <span className="hidden flex-1 text-xs sm:inline">Trash</span>
              </div>
            </div>

            <div className="mt-auto hidden space-y-1.5 border-t border-[#d8e0e8] pt-2 sm:block dark:border-white/10">
              <div className="flex items-center gap-2 px-1 text-[11px] text-[#7a8692] dark:text-white/45">
                <Settings className="size-3.5 opacity-70" />
                Settings
              </div>
              <p className="truncate px-1 pt-1 text-[11px] text-[#7a8692] dark:text-white/45">
                rsv
              </p>
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col bg-white dark:bg-[#12181f]">
            <div className="border-b border-[#e8eef4] px-2 py-2 sm:px-3 md:px-4 dark:border-white/10">
              <div className="flex h-8 items-center gap-2 rounded-full border border-[#e6e6e6] bg-[#f2f6fc] px-3 text-[11px] text-[#444746] sm:h-9 sm:text-xs md:h-10 dark:border-white/10 dark:bg-white/5 dark:text-white/55">
                <Search className="size-3.5 opacity-50 sm:size-4" />
                <span>Search mail</span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {rows.map((row) => (
                <div
                  key={row.subject}
                  className={cn(
                    "grid grid-cols-[1fr_auto] gap-2 border-b border-[#eef2f6] px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5 md:px-4 md:py-3 dark:border-white/5",
                    row.active
                      ? "bg-[#e8f0fe] dark:bg-[#004a77]/35"
                      : row.unread
                        ? "bg-white dark:bg-[#12181f]"
                        : "bg-[#fafbfc] dark:bg-[#0f1419]",
                  )}
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-[11px] sm:text-xs md:text-sm",
                        row.unread
                          ? "font-bold text-[#041e49] dark:text-[#e8f0fe]"
                          : "font-medium text-[#3c4a57] dark:text-white/70",
                      )}
                    >
                      {row.from}
                    </p>
                    <p
                      className={cn(
                        "truncate text-[11px] sm:text-xs md:text-sm",
                        row.unread
                          ? "font-semibold text-[#041e49] dark:text-[#c2e7ff]"
                          : "text-[#3c4a57] dark:text-white/65",
                      )}
                    >
                      {row.subject}
                    </p>
                    <p className="truncate text-[10px] text-[#7a8692] sm:text-[11px] md:text-xs dark:text-white/40">
                      {row.preview}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-[#7a8692] sm:text-xs dark:text-white/40">
                    {row.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
