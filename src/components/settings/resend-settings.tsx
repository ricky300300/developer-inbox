"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Trash2 } from "lucide-react";
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

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/providers/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "resend",
          apiKey,
          webhookSecret,
          fromEmail,
          connectionId: active?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      toast.success(active ? "Connection updated" : "Resend connected");
      setApiKey("");
      setWebhookSecret("");
      await load();
    } catch {
      toast.error("Failed to save connection");
    } finally {
      setSaving(false);
    }
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
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Resend and configure your inbound webhook.
        </p>
      </div>

      <Card className="border-border/60 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Resend</CardTitle>
              <CardDescription>
                API-first email. Domains stay in Resend — one connection covers all of them.
              </CardDescription>
            </div>
            {active ? (
              <Badge variant="secondary">{active.isActive ? "Connected" : "Inactive"}</Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={onSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={active?.hasApiKey ? "•••••••• (leave blank to keep)" : "re_xxxxxxxx"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!active}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Signing Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder={
                    active?.hasWebhookSecret
                      ? "•••••••• (leave blank to keep)"
                      : "whsec_xxxxxxxx"
                  }
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  required={!active}
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
                  Used for new outbound mail. Replies use the address that received the inbound email.
                </p>
              </div>

              {active ? (
                <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={active.webhookUrl} className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={copyWebhook}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In Resend → Webhooks, subscribe to <code>email.received</code> and paste this URL.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving || (!active && !apiKey)}>
                  {saving ? "Saving…" : active ? "Update connection" : "Connect Resend"}
                </Button>
                {active ? (
                  <Button type="button" variant="ghost" onClick={onDelete}>
                    <Trash2 className="mr-2 size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
