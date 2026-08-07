# Connect Resend to Developer Inbox

This guide walks you through receiving inbound email and sending replies with [Resend](https://resend.com) and Developer Inbox.

Developer Inbox is **not** an email provider. Resend receives and sends mail; this app stores conversations and gives you a UI to read and reply.

---

## What you will set up

1. A Resend account and API key  
2. A domain (or Resend receiving address) for inbound mail  
3. A webhook from Resend → Developer Inbox  
4. A provider connection inside Developer Inbox Settings  

When finished, mail sent to your domain appears in the Inbox, and you can reply or compose from the app.

---

## Prerequisites

- Developer Inbox running locally or deployed (see the root [README](../README.md))
- A [Resend](https://resend.com) account
- For production inbound: a domain you control (DNS access)
- For local webhooks: a public HTTPS tunnel (e.g. [ngrok](https://ngrok.com), Cloudflare Tunnel, or Vercel preview URL)

Set `NEXT_PUBLIC_APP_URL` to the URL Resend can reach:

```bash
# Local with tunnel example
NEXT_PUBLIC_APP_URL="https://your-subdomain.ngrok-free.app"

# Production example
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

Restart the app after changing env vars so Settings shows the correct webhook URL.

---

## Step 1 — Create a Resend API key

1. Open the [Resend dashboard](https://resend.com/api-keys).
2. Click **Create API Key**.
3. Give it a name (e.g. `developer-inbox`).
4. Choose full access (or at least send + receiving permissions).
5. Copy the key (`re_...`) and store it securely — you will paste it into Developer Inbox Settings.

---

## Step 2 — Set up a sending / receiving domain

### Option A — Custom domain (recommended)

1. Go to [Resend Domains](https://resend.com/domains).
2. Add your domain (e.g. `honestify.me` or a subdomain like `mail.honestify.me`).
3. Add the DNS records Resend shows (SPF, DKIM, and any others).
4. Wait until the domain status is **Verified**.

#### Enable receiving (inbound)

1. Open the domain details in Resend.
2. Enable **Receiving** for that domain.
3. Add the **MX** record Resend provides.

**Important:** MX must not conflict with an existing mailbox provider on the same hostname. If `honestify.me` already receives mail via Google/Microsoft, use a **subdomain** for Resend inbound (e.g. `inbox.honestify.me`) so you do not take over the root MX.

Once MX is correct, Resend accepts mail for **any address** at that domain (e.g. `ricky@inbox.honestify.me`, `support@inbox.honestify.me`).

### Option B — Resend-managed receiving address

For quick tests, Resend can provide a `*.resend.app` receiving address. Use that if you only need to verify the webhook before setting up DNS.

---

## Step 3 — Deploy or tunnel your webhook URL

Resend must `POST` to a publicly reachable HTTPS endpoint:

```text
https://<your-app-host>/api/webhooks/resend/<connectionId>
```

`<connectionId>` is created in the next step inside Developer Inbox.

### Local development

1. Start the app: `npm run dev`
2. Start a tunnel to port `3000`
3. Set `NEXT_PUBLIC_APP_URL` to the tunnel HTTPS URL
4. Restart `npm run dev`

### Production

Deploy to Vercel (or similar), set env vars in the host dashboard, and use your production URL as `NEXT_PUBLIC_APP_URL`.

---

## Step 4 — Connect Resend in Developer Inbox

1. Register or sign in to Developer Inbox.
2. Open **Settings**.
3. Under **Resend**, fill in:

| Field | Where it comes from |
|-------|---------------------|
| **API Key** | Step 1 (`re_...`) |
| **Webhook Signing Secret** | Leave blank for a moment — you will get this in Step 5 after creating the webhook (`whsec_...`) |
| **Default From Address** | A verified sender on your Resend domain (e.g. `hello@yourdomain.com`) |

4. Click **Connect Resend** (you can save the API key and from address first; update the webhook secret right after Step 5).
5. Copy the **Webhook URL** shown in Settings. It looks like:

```text
https://your-app.example/api/webhooks/resend/clxxxxxxxx
```

That URL is unique per connection. Do not share it publicly beyond Resend’s webhook config.

---

## Step 5 — Create the Resend webhook

1. Open [Resend Webhooks](https://resend.com/webhooks).
2. Click **Add Webhook**.
3. Paste the Developer Inbox webhook URL from Settings.
4. Subscribe to **`email.received`** (required for inbound).
5. Save the webhook.
6. Copy the **Signing secret** (`whsec_...`).
7. Return to Developer Inbox **Settings**, paste the signing secret into **Webhook Signing Secret**, and save/update the connection.

Developer Inbox verifies every webhook with this secret (Svix signatures). Without it, inbound events are rejected.

---

## Step 6 — Send a test inbound email

1. From any mailbox, send an email **to** an address on your receiving domain  
   (e.g. `you@your-receiving-domain.com`).
2. Within a few seconds you should see a new conversation in **Inbox**.
3. Open the thread — From / To / Date and the body should appear.
4. Reply from the thread. Replies send **from the address that received the mail** (not necessarily the Settings default).

### If nothing appears

- Confirm the webhook URL matches Settings and `NEXT_PUBLIC_APP_URL`
- Confirm the event type includes `email.received`
- Confirm the signing secret matches
- Check the app logs (in development you will see `[webhook]` lines)
- In Resend, open the webhook and check delivery / retry history
- Confirm MX for the receiving domain points at Resend

---

## Step 7 — Send a new outbound email (optional)

1. Click **Compose** in the inbox.
2. **From** prefills with your Settings default; you can edit it to any **verified** Resend sender.
3. Fill To, Subject, and body, then **Send**.
4. A new conversation is created for that outbound message.

---

## How it works (short)

```text
External sender
    │
    ▼
Resend (MX / receiving)
    │  email.received webhook
    ▼
POST /api/webhooks/resend/:connectionId
    │  verify signature → fetch body via Receiving API
    ▼
Developer Inbox (conversations + messages)
    │
    ▼
You reply / compose in the UI
    │
    ▼
Resend Emails API → recipient
```

Notes:

- Resend webhooks carry **metadata only**. Developer Inbox fetches HTML/text via the Receiving API.
- One Resend API key / connection can cover **multiple domains** on that Resend account.
- Domains are managed in Resend; Developer Inbox stores credentials and conversations, not DNS.

---

## Security checklist

- [ ] Never commit `.env` or API keys  
- [ ] Use `ENCRYPTION_KEY` so provider secrets are encrypted at rest  
- [ ] Keep webhook signing secret set and rotated if leaked  
- [ ] Prefer HTTPS only for `NEXT_PUBLIC_APP_URL`  
- [ ] Restrict Resend API key scope when possible  

---

## Related docs

- [Resend — Receiving emails](https://resend.com/docs/dashboard/receiving/introduction)
- [Resend — `email.received` webhook](https://resend.com/docs/webhooks/emails/received)
- [Resend — Custom domains](https://resend.com/docs/dashboard/domains/introduction)
- [Developer Inbox README](../README.md)
