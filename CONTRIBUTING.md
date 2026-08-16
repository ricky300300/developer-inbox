# Contributing to Developer Inbox

Thanks for helping improve Developer Inbox.

## Development setup

1. Fork and clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `DIRECT_URL` (if using Supabase), and `ENCRYPTION_KEY`.
4. Run migrations: `npm run db:migrate:dev`
5. Start the app: `npm run dev`

Open [http://localhost:3000](http://localhost:3000).

## Requirements

- Node.js 20+ (LTS recommended)
- PostgreSQL (local or Supabase)

## Checks before opening a PR

```bash
npm run lint
npm run typecheck
```

## Pull requests

- Keep PRs focused on one change when possible.
- Prefer clear commit messages that explain **why**.
- Update docs (`README.md`, `docs/`) when behavior or setup steps change.
- Do not commit `.env`, API keys, or webhook secrets.

## Project conventions

- Provider-specific logic lives under `src/providers/<id>/`.
- Domain types for email stay provider-agnostic (`InboundEmail`, `OutboundMessage`, etc.).
- Mailbox access goes through `src/lib/mailboxes/access.ts` (do not scatter grant checks).
- Prefer matching existing patterns in nearby files (UI, API routes, Prisma).
- Settings UI: `/settings` overview, `/settings/connection`, `/settings/mailboxes`.

## Reporting bugs

Use GitHub Issues with steps to reproduce, expected vs actual behavior, and environment details (OS, Node version, local vs hosted DB).

Security issues: see [SECURITY.md](SECURITY.md).
