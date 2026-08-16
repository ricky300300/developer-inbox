"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, KeyRound, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ConnectionSummary = {
  id: string;
  fromEmail: string;
  hasWebhookSecret: boolean;
  mailboxes: Array<{ id: string; email: string }>;
};

export function SettingsOverview() {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<ConnectionSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/providers/connections");
        const data = await res.json();
        if (!cancelled && res.ok) {
          setConnection(data.connections?.[0] ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = Boolean(connection?.hasWebhookSecret);
  const mailboxCount = connection?.mailboxes?.length ?? 0;

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Status</CardTitle>
                {ready ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="size-3.5" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <CircleDashed className="size-3.5" />
                    Setup needed
                  </Badge>
                )}
              </div>
              <CardDescription>
                {ready
                  ? "Resend is connected. Manage credentials or add mailbox addresses below."
                  : "Finish connecting Resend to receive and send mail."}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/settings/connection"
              className="group rounded-xl border border-border/60 bg-card p-4 transition-colors active:bg-muted/50 hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted sm:size-9">
                  <KeyRound className="size-4 text-foreground" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" />
              </div>
              <h2 className="mt-3 text-sm font-medium">Connection</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                API key, webhook URL, and signing secret for Resend.
              </p>
              <p className="mt-3 text-xs font-medium text-foreground/80">
                {ready
                  ? "Connected · manage credentials"
                  : connection
                    ? "Continue setup"
                    : "Connect Resend"}
              </p>
            </Link>

            <Link
              href="/settings/mailboxes"
              className="group rounded-xl border border-border/60 bg-card p-4 transition-colors active:bg-muted/50 hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted sm:size-9">
                  <Mail className="size-4 text-foreground" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" />
              </div>
              <h2 className="mt-3 text-sm font-medium">Mailboxes</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Addresses that appear in the sidebar switcher and filter Inbox /
                Sent.
              </p>
              <p className="mt-3 text-xs font-medium text-foreground/80">
                {mailboxCount === 0
                  ? ready
                    ? "Add your first address"
                    : "Available after connecting"
                  : `${mailboxCount} address${mailboxCount === 1 ? "" : "es"}`}
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
