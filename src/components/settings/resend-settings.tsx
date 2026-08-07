"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BookOpen, Check, Copy, Trash2 } from "lucide-react";
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

export function ResendSettings() {
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

  const step: SetupStep = !active
    ? 1
    : !active.hasWebhookSecret
      ? 2
      : 3;

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
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Resend in three steps — API key, webhook URL, then signing
            secret.
          </p>
        </div>
        <Link
          href="/docs/connect-resend"
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground"
        >
          <BookOpen className="size-3.5" />
          Setup guide
        </Link>
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Resend</CardTitle>
              <CardDescription>
                Domains stay in Resend. One connection covers all receiving domains on the account.
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
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-6">
              {/* Step 1 */}
              {(!active) && (
                <section className="space-y-3">
                  <div>
                    <h2 className="text-sm font-medium">Step 1 — Save API credentials</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create an API key in Resend, then save it here. We will generate your webhook URL next.
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">Default From Address</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        placeholder="inbox@yourdomain.com"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Verified Resend sender used when composing new mail.
                      </p>
                    </div>
                    <Button type="submit" disabled={saving || !apiKey.trim()}>
                      {saving ? "Saving…" : "Save & continue"}
                    </Button>
                  </form>
                </section>
              )}

              {/* Steps 2 + 3 while incomplete */}
              {active && !active.hasWebhookSecret ? (
                <>
                  <section className="space-y-3">
                    <div>
                      <h2 className="text-sm font-medium">Step 2 — Create webhook in Resend</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        In Resend → Webhooks → Add Webhook, paste this URL and subscribe to{" "}
                        <code className="rounded bg-muted px-1 py-0.5">email.received</code>.
                        Resend will show the signing secret only after you save the webhook.
                      </p>
                    </div>
                    <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
                      <Label>Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={active.webhookUrl}
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copyWebhook}
                        >
                          {copied ? (
                            <Check className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3 border-t border-border/50 pt-6">
                    <div>
                      <h2 className="text-sm font-medium">Step 3 — Save signing secret</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Copy the <code className="rounded bg-muted px-1 py-0.5">whsec_…</code>{" "}
                        secret from the Resend webhook you just created and paste it below.
                      </p>
                    </div>
                    <form onSubmit={onStep3} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhookSecret">Webhook Signing Secret</Label>
                        <Input
                          id="webhookSecret"
                          type="password"
                          placeholder="whsec_xxxxxxxx"
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="submit"
                          disabled={saving || !webhookSecret.trim()}
                        >
                          {saving ? "Saving…" : "Finish setup"}
                        </Button>
                        <Button type="button" variant="ghost" onClick={onDelete}>
                          <Trash2 className="mr-2 size-4" />
                          Start over
                        </Button>
                      </div>
                    </form>
                  </section>
                </>
              ) : null}

              {/* Complete — manage connection */}
              {active?.hasWebhookSecret ? (
                <section className="space-y-4">
                  <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={active.webhookUrl}
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={copyWebhook}
                      >
                        {copied ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keep this URL pointed at your Resend <code>email.received</code> webhook.
                    </p>
                  </div>

                  <form onSubmit={onUpdateCredentials} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmailReady">Default From Address</Label>
                      <Input
                        id="fromEmailReady"
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiKeyReady">Rotate API Key</Label>
                      <Input
                        id="apiKeyReady"
                        type="password"
                        placeholder="•••••••• (leave blank to keep)"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookSecretReady">Rotate Signing Secret</Label>
                      <Input
                        id="webhookSecretReady"
                        type="password"
                        placeholder="•••••••• (leave blank to keep)"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Update connection"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={onDelete}>
                        <Trash2 className="mr-2 size-4" />
                        Remove
                      </Button>
                    </div>
                  </form>
                </section>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
