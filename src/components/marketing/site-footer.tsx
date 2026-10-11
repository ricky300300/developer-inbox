import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1a3544] bg-[#0b1f2a] text-[#f6fafb] dark:border-[#12202a] dark:bg-[#050a0d]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 text-[#f6fafb]">
            <Logo decorative className="size-8 shrink-0" />
            <span className="m-display text-2xl font-semibold">
              Developer Inbox
            </span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#f6fafb]/70">
            A managed conversation inbox for API-first email — Resend today,
            more providers next.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f6fafb]/45">
            Product
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-[#f6fafb]/80 hover:text-[#f6fafb]">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/pricing"
                className="text-[#f6fafb]/80 hover:text-[#f6fafb]"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/docs" className="text-[#f6fafb]/80 hover:text-[#f6fafb]">
                Docs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f6fafb]/45">
            Company
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/about"
                className="text-[#f6fafb]/80 hover:text-[#f6fafb]"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="text-[#f6fafb]/80 hover:text-[#f6fafb]"
              >
                Log in
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="text-[#f6fafb]/80 hover:text-[#f6fafb]"
              >
                Sign up
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#f6fafb]/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-[#f6fafb]/45 sm:px-6">
          © {new Date().getFullYear()} Developer Inbox. Built for teams who ship
          email through APIs.
        </p>
      </div>
    </footer>
  );
}
