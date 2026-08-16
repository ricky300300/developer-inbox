"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MailboxRow = {
  id: string;
  email: string;
  displayName: string | null;
  connectionId: string;
};

type ConnectionView = {
  id: string;
  hasWebhookSecret: boolean;
  fromEmail: string;
};

export function MailboxesSettings() {
  const [loading, setLoading] = useState(true);
  const [mailboxes, setMailboxes] = useState<MailboxRow[]>([]);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionView | null>(null);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [mbRes, connRes] = await Promise.all([
        fetch("/api/mailboxes"),
        fetch("/api/providers/connections"),
      ]);
      const mbData = await mbRes.json();
      const connData = await connRes.json();
      if (mbRes.ok) {
        setMailboxes(mbData.mailboxes ?? []);
        setPreferredId(mbData.preferredMailboxId ?? null);
      }
      if (connRes.ok) {
        setConnection(connData.connections?.[0] ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function addMailbox() {
    if (!connection || !email.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: connection.id,
          email: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add mailbox");
        return;
      }
      toast.success("Mailbox added");
      setEmail("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function removeMailbox(id: string) {
    if (!confirm("Remove this mailbox address from the switcher?")) return;
    const res = await fetch(`/api/mailboxes?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to remove mailbox");
      return;
    }
    toast.success("Mailbox removed");
    await load();
  }

  async function setPreferred(id: string) {
    const res = await fetch("/api/mailboxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredMailboxId: id }),
    });
    if (!res.ok) {
      toast.error("Could not set preferred mailbox");
      return;
    }
    setPreferredId(id);
    toast.success("Preferred mailbox updated");
  }

  const ready = Boolean(connection?.hasWebhookSecret);

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Mailbox addresses</CardTitle>
          <CardDescription>
            These addresses appear in the sidebar switcher and filter Inbox and
            Sent. One Resend connection can cover many addresses on your
            receiving domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !connection ? (
            <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
              <Mail className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">Connect Resend first</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mailboxes are linked to your provider connection.
              </p>
              <Link
                href="/settings/connection"
                className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
              >
                Go to Connection
              </Link>
            </div>
          ) : !ready ? (
            <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center">
              <p className="text-sm font-medium">Finish connection setup</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete the webhook signing secret, then add addresses here.
              </p>
              <Link
                href="/settings/connection"
                className="mt-4 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                Continue setup
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-mailbox">Add address</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="new-mailbox"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@yourdomain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-11 min-w-0 text-base sm:min-h-9 sm:text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addMailbox();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={adding || !email.trim()}
                    onClick={() => void addMailbox()}
                    className="h-11 w-full shrink-0 gap-1.5 sm:h-9 sm:w-auto"
                  >
                    <Plus className="size-4" />
                    {adding ? "Adding…" : "Add"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be a verified sender / receiving address on your Resend
                  domain.
                </p>
              </div>

              {mailboxes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  No mailboxes yet. Add an address above to use the switcher.
                </div>
              ) : (
                <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
                  {mailboxes.map((m) => {
                    const isPreferred = preferredId === m.id;
                    return (
                      <li
                        key={m.id}
                        className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:gap-3"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted sm:size-9">
                            <Mail className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {m.email}
                            </p>
                            {isPreferred ? (
                              <p className="text-xs text-muted-foreground">
                                Preferred · default filter & compose
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                In sidebar switcher
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 flex-1 gap-1.5 text-muted-foreground sm:h-8 sm:flex-none"
                            disabled={isPreferred}
                            onClick={() => void setPreferred(m.id)}
                          >
                            <Star
                              className={
                                isPreferred
                                  ? "size-3.5 fill-current text-foreground"
                                  : "size-3.5"
                              }
                            />
                            <span className="sm:hidden">
                              {isPreferred ? "Preferred" : "Prefer"}
                            </span>
                            <span className="hidden sm:inline">
                              {isPreferred ? "Preferred" : "Make preferred"}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 shrink-0 text-muted-foreground sm:size-8"
                            aria-label={`Remove ${m.email}`}
                            onClick={() => void removeMailbox(m.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
