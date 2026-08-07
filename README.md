# Developer Inbox

**A conversation inbox for API-first email providers.**

Connect Resend, receive inbound mail over webhooks, and reply or compose from a clean web UI.

Developer Inbox is **not** an email provider. It sits on top of providers like Resend and turns transactional or domain inbound into threaded conversations.

---

## Features

- Username / password auth (no OAuth for V1)
- Inbox with search, conversation list, and email-style thread view
- Rich reply & compose (bold, lists, links) with HTML that works in major clients
- Resend provider: inbound webhooks, outbound send, reply-from receiving address
- Encrypted API keys & webhook secrets at rest
- Dark / light theme
- Provider adapter pattern ready for SES, Mailgun, Postmark, and others later

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/ricky300300/developer-inbox.git
cd developer-inbox
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (Supabase pooler recommended) |
| `ENCRYPTION_KEY` | 32-byte key, base64 — `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Public app URL (used for webhook links in Settings) |

### 3. Migrate and run

```bash
npm run db:migrate:dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, then connect Resend.

### 4. Connect Resend

Follow the full walkthrough:

**[docs/connect-resend.md](docs/connect-resend.md)** — step-by-step domain, webhook, and Settings setup.

---

## Screenshots of the flow

Typical path after setup:

1. **Settings** → paste Resend API key, webhook secret, default From  
2. **Resend** → webhook on `email.received` → your `/api/webhooks/resend/:id` URL  
3. **Inbox** → inbound threads appear automatically  
4. **Reply** or **Compose** → send via Resend  

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui |
| API | Next.js Route Handlers |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Hosting | Vercel + Supabase (Postgres only — app owns auth) |
| Email (V1) | Resend |

---

## Project structure

```text
src/
  app/                 # App Router pages + API routes
  components/          # UI (inbox, composer, settings, layout)
  lib/
    auth/              # Sessions, Argon2 passwords
    conversations/     # Ingest, reply, compose, search
    email/             # Client-safe HTML serialization
    crypto/            # Secret encryption
  providers/
    types.ts           # Provider-agnostic contracts
    registry.ts        # getProvider('resend')
    resend/            # Send + webhook adapter
docs/
  connect-resend.md     # Resend setup guide
```

---

## Architecture

```text
Sender ──► Resend (MX) ──email.received──► /api/webhooks/resend/:connectionId
                                              │
                                              ▼
                                         InboundEmail
                                              │
                                              ▼
                                    Conversations / Messages
                                              │
User UI (Inbox / Compose) ──send──► Resend Emails API ──► Recipient
```

- App code uses domain types (`InboundEmail`, `OutboundMessage`).
- Provider-specific logic lives only under `src/providers/<id>/`.
- Adding another provider ≈ new adapter + registry entry + Settings fields.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run production server |
| `npm run db:migrate:dev` | Apply migrations (development) |
| `npm run db:migrate:prod` | Deploy migrations |
| `npm run db:studio` | Prisma Studio |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

---

## Environment reference

```bash
DATABASE_URL=                 # Postgres (Supabase)
ENCRYPTION_KEY=               # openssl rand -base64 32
NEXT_PUBLIC_APP_URL=          # https://your-host (webhook display + absolute URLs)
```

Never commit `.env`. `.env.example` is safe to commit.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Connect Resend](docs/connect-resend.md) | Domains, MX, webhooks, Settings, testing inbound/outbound |

---

## Security notes

- Passwords hashed with Argon2id  
- Sessions: opaque httpOnly cookie; only token hashes stored  
- Provider secrets encrypted with AES-256-GCM (`ENCRYPTION_KEY`)  
- Resend webhooks verified with Svix signing secret  

---

## Roadmap (not in V1)

- Additional providers (SES, Mailgun, Postmark, SMTP, Gmail, Outlook)
- Attachment download / storage
- Teams / multi-user workspaces
- Real-time updates (websockets)

---

## License

Open source — use and contribute as you like. Add a `LICENSE` file if you publish under a specific license.
