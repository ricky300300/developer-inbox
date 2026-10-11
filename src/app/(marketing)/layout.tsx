import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSessionUser } from "@/lib/auth/session";
import "../marketing.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-marketing-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Developer Inbox",
    template: "%s · Developer Inbox",
  },
  description:
    "Managed conversation inbox for API-first email providers — Resend today, team mailboxes, and persistent storage.",
};

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className={`marketing ${montserrat.variable} min-h-screen`}>
      <SiteHeader
        isLoggedIn={Boolean(user)}
        username={user?.username ?? null}
      />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
