"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Mail, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ConnectionView = {
  id: string;
  provider: string;
  isActive: boolean;
  fromEmail: string;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  webhookUrl: string;
  createdAt: string;
};

type SetupStep = 1 | 2 | 3;

function StepPill({
  step,
  current,
  label,
}: {
  step: SetupStep;
  current: SetupStep;
  label: string;
}) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          done && "bg-primary text-primary-foreground",
          active && "bg-foreground text-background",
          !done && !active && "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : step}
      </span>
      <span
        className={cn(
          "text-sm",
          active ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function ConnectionSettings() {
  const [connections, setConnections] = useState<ConnectionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/providers/connections");
      const data = await res.json();
      if (res.ok) {
        setConnections(data.connections ?? []);
        const first = data.connections?.[0];
        if (first?.fromEmail) setFromEmail(first.fromEmail);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const active = connections[0];
  const step: SetupStep = !active ? 1 : !active.hasWebhookSecret ? 2 : 3;

  async function saveConnection(payload: {
    apiKey?: string;
    webhookSecret?: string;
    fromEmail: string;
    connectionId?: string;
  }) {
    setSaving(true);
    try {
      const res = await fetch("/api/providers/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "resend",
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return false;
      }
      setApiKey("");
      setWebhookSecret("");
      await load();
      return true;
    } catch {
      toast.error("Failed to save connection");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onStep1(e: FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("API key is required");
      return;
    }
    const ok = await saveConnection({
      apiKey,
      fromEmail,
      connectionId: active?.id,
    });
    if (ok) toast.success("API key saved — copy your webhook URL next");
  }

  async function onStep3(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    if (!webhookSecret.trim() && !active.hasWebhookSecret) {
      toast.error("Paste the signing secret from Resend");
      return;
    }
    const ok = await saveConnection({
      fromEmail,
      webhookSecret: webhookSecret.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
      connectionId: active.id,
    });
    if (ok) toast.success("Webhook secret saved — Resend is ready");
  }

  async function onUpdateCredentials(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    const ok = await saveConnection({
      fromEmail,
      apiKey: apiKey.trim() || undefined,
      webhookSecret: webhookSecret.trim() || undefined,
      connectionId: active.id,
    });
    if (ok) toast.success("Connection updated");
  }

  async function onDelete() {
    if (!active) return;
    if (!confirm("Remove this Resend connection? Inbound mail will stop.")) {
      return;
    }
    const res = await fetch(`/api/providers/connections?id=${active.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to remove connection");
      return;
    }
    toast.success("Connection removed");
    setFromEmail("");
    setApiKey("");
    setWebhookSecret("");
    await load();
  }

  async function copyWebhook() {
    if (!active?.webhookUrl) return;
    await navigator.clipboard.writeText(active.webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Resend connection</CardTitle>
            <CardDescription className="mt-1">
              Domains stay in Resend. One connection covers all receiving
              addresses on the account.
            </CardDescription>
          </div>
          {active?.hasWebhookSecret ? (
            <Badge variant="secondary">Ready</Badge>
          ) : active ? (
            <Badge variant="outline">Setup incomplete</Badge>
          ) : (
            <Badge variant="outline">Not connected</Badge>
          )}
        </div>

        {!active?.hasWebhookSecret ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:flex-wrap sm:gap-6">
            <StepPill step={1} current={step === 3 ? 3 : step} label="API key" />
            <StepPill
              step={2}
              current={step === 3 ? 3 : step}
              label="Webhook URL"
            />
            <StepPill
              step={3}
              current={step === 3 ? 3 : step}
              label="Signing secret"
            />
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-6">
            {!active ? (
              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium">
                    Step 1 — Save API credentials
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create an API key in Resend, then save it here. We generate
                    your webhook URL next.
                  </p>
                </div>
                <form onSubmit={onStep1} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="re_xxxxxxxx"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Primary From Address</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="inbox@yourdomain.com"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Verified Resend sender. You can add more addresses later
                      under Mailboxes.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full sm:h-9 sm:w-auto"
                    disabled={saving || !apiKey.trim()}
                  >
                    {saving ? "Saving…" : "Save & continue"}
                  </Button>
                </form>
              </section>
            ) : null}

            {active && !active.hasWebhookSecret ? (
              <>
                <section className="space-y-3">
                  <div>
                    <h2 className="text-sm font-medium">
                      Step 2 — Create webhook in Resend
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      In Resend → Webhooks → Add Webhook, paste this URL and
                      subscribe to{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        email.received
                      </code>
                      . The signing secret appears only after you save.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <Label>Webhook URL</Label>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                      <Input
                        readOnly
                        value={active.webhookUrl}
                        className="min-h-11 min-w-0 font-mono text-xs sm:min-h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full shrink-0 gap-1.5 sm:h-9 sm:w-auto"
                        onClick={copyWebhook}
                      >
                        {copied ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                        Copy
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="space-y-3 border-t border-border/50 pt-6">
                  <div>
                    <h2 className="text-sm font-medium">
                      Step 3 — Save signing secret
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Paste the{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        whsec_…
                      </code>{" "}
                      secret from the webhook you just created.
                    </p>
                  </div>
                  <form onSubmit={onStep3} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhookSecret">
                        Webhook Signing Secret
                      </Label>
                      <Input
                        id="webhookSecret"
                        type="password"
                        placeholder="whsec_xxxxxxxx"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        required
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="submit"
                        className="h-11 w-full sm:h-9 sm:w-auto"
                        disabled={saving || !webhookSecret.trim()}
                      >
                        {saving ? "Saving…" : "Finish setup"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 w-full sm:h-9 sm:w-auto"
                        onClick={onDelete}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Start over
                      </Button>
                    </div>
                  </form>
                </section>
              </>
            ) : null}

            {active?.hasWebhookSecret ? (
              <section className="space-y-5">
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <Label>Webhook URL</Label>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <Input
                      readOnly
                      value={active.webhookUrl}
                      className="min-h-11 min-w-0 font-mono text-xs sm:min-h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full shrink-0 gap-1.5 sm:h-9 sm:w-auto"
                      onClick={copyWebhook}
                    >
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this pointed at your Resend{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      email.received
                    </code>{" "}
                    webhook.
                  </p>
                </div>

                <form onSubmit={onUpdateCredentials} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmailReady">Primary From Address</Label>
                    <Input
                      id="fromEmailReady"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Default sender for this connection. Add more under{" "}
                      <Link
                        href="/settings/mailboxes"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        Mailboxes
                      </Link>
                      .
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyReady">Rotate API Key</Label>
                      <Input
                        id="apiKeyReady"
                        type="password"
                        placeholder="Leave blank to keep"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookSecretReady">
                        Rotate Signing Secret
                      </Label>
                      <Input
                        id="webhookSecretReady"
                        type="password"
                        placeholder="Leave blank to keep"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button
                      type="submit"
                      className="h-11 w-full sm:h-9 sm:w-auto"
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 w-full sm:h-9 sm:w-auto"
                      onClick={onDelete}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Remove connection
                    </Button>
                    <Link
                      href="/settings/mailboxes"
                      className="inline-flex h-11 w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:ml-auto sm:h-8 sm:w-auto sm:justify-start"
                    >
                      <Mail className="size-3.5" />
                      Manage mailboxes
                    </Link>
                  </div>
                </form>
              </section>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
