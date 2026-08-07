import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { countConversations } from "@/lib/conversations/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [inbox, sent] = await Promise.all([
    countConversations({ userId: user.id, folder: "inbox" }),
    countConversations({ userId: user.id, folder: "sent" }),
  ]);

  return (
    <Suspense fallback={null}>
      <AppShell username={user.username} counts={{ inbox, sent }}>
        {children}
      </AppShell>
    </Suspense>
  );
}
