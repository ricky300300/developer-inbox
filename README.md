# Developer Inbox

Conversation inbox for API-first email providers. Connect Resend, receive inbound webhooks, and reply from a modern web UI.

This is **not** an email provider.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- Prisma 7 + Supabase PostgreSQL
- In-house username/password auth (Argon2id + httpOnly sessions)
- Extensible provider adapters (Resend in V1)

## Setup

1. Copy env and fill values:

```bash
cp .env.example .env
```

Generate an encryption key:

```bash
openssl rand -base64 32
```

2. Point `DATABASE_URL` at your Supabase Postgres connection string (pooler recommended for serverless).

3. Install and migrate:

```bash
npm install
npm run db:migrate:dev
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Connect Resend

1. Register / sign in.
2. Open **Settings** and save your Resend API key, webhook signing secret, and default from address.
3. Copy the webhook URL shown in Settings.
4. In Resend → Webhooks, create a webhook for `email.received` pointing at that URL.
5. Ensure your receiving domain(s) are configured in Resend (one connection covers all domains on that account).

## Architecture notes

- App code talks to provider-agnostic domain types (`InboundEmail`, `OutboundMessage`).
- Provider-specific logic lives under `src/providers/<id>/`.
- Webhook route: `POST /api/webhooks/[provider]/[connectionId]`.
- Secrets are encrypted at rest with AES-256-GCM (`ENCRYPTION_KEY`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Generate Prisma client + production build |
| `npm run db:migrate:dev` | Apply migrations (dev) |
| `npm run db:migrate:prod` | Deploy migrations |
| `npm run typecheck` | TypeScript check |
