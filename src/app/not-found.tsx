import Link from "next/link";
import { Montserrat } from "next/font/google";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSessionUser } from "@/lib/auth/session";
import "./marketing.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-marketing-sans",
  display: "swap",
});

export default async function NotFound() {
  const user = await getSessionUser();

  return (
    <div className={`marketing ${montserrat.variable} min-h-screen`}>
      <SiteHeader
        isLoggedIn={Boolean(user)}
        username={user?.username ?? null}
      />
      <main className="m-atmosphere relative overflow-hidden">
        <div className="m-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
          <Logo className="m-animate-in size-14 text-[var(--m-ink)]" />
          <p className="m-animate-in m-animate-in-delay-1 mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--m-accent-deep)]">
            404
          </p>
          <h1 className="m-display m-animate-in m-animate-in-delay-1 mt-3 text-4xl font-semibold tracking-tight text-[var(--m-ink)] sm:text-5xl">
            This address is empty
          </h1>
          <p className="m-animate-in m-animate-in-delay-2 mt-4 max-w-md text-base leading-relaxed text-[var(--m-muted)] sm:text-lg">
            That page isn&apos;t in this inbox. It may have moved, or the link
            might be wrong.
          </p>
          <div className="m-animate-in m-animate-in-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="m-btn-primary">
              Back home
            </Link>
            {user ? (
              <Link href="/inbox" className="m-btn-secondary">
                Open inbox
              </Link>
            ) : (
              <Link href="/docs" className="m-btn-secondary">
                View docs
              </Link>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
