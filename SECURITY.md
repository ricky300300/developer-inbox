# Security Policy

## Supported versions

Security fixes are applied on the latest `main` branch.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Prefer one of:

1. [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) for this repository (if enabled), or
2. Opening a draft GitHub Security Advisory on the repo.

Include:

- A description of the issue and impact
- Steps to reproduce or a proof of concept
- Affected versions / commit if known

We aim to acknowledge reports within a few days and will coordinate a fix and disclosure timeline with you.

## Security notes for operators

- Never commit `.env` or live credentials
- Protect `ENCRYPTION_KEY` — it encrypts provider API keys and webhook secrets at rest
- Keep Resend webhook signing secrets configured so inbound requests are verified
- Prefer HTTPS in production so webhook endpoints are reachable securely
