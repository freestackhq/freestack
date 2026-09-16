---
category: Email & forms
description: Email and form infrastructure.
order: 4
---

# Email & forms

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Resend](#resend) | free forever | anyone | commercial ok | 3k emails/mo · 100/day · 1 domain |
| [Brevo](#brevo) | free forever | anyone | commercial ok | 300 emails/day |
| [Loops](#loops) | free forever | anyone | commercial ok | 1k contacts free |
| [Tally / Formspark](#tally-formspark) | free forever | anyone | commercial ok | Generous free form caps |
| [Twilio Trial](#twilio-trial) | credits | anyone | commercial ok | Trial credit · numbers can be restricted · PAYG after |
| [Vonage (Nexmo)](#vonage-nexmo) | credits | anyone | commercial ok | Signup credit crumbs · PAYG |
| [Postmark](#postmark) | credits | anyone | commercial ok | Free trial / approval · not forever-free |
| [Twilio SendGrid](#twilio-sendgrid) | free forever | anyone | commercial ok | Free forever ~100 emails/day class · verify current Free plan |
| [Formspree](#formspree) | free forever | anyone | commercial ok | ~50 submissions/mo · 1 form on free |
| [Forward Email](#forward-email) | free forever | anyone | commercial ok | Unlimited aliases free class · paid for outbound SMTP |

---

## Resend

| Field | Value |
|-------|-------|
| URL | https://resend.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 3k emails/mo · 100/day · 1 domain |

Transactional email with React Email DX.

**Pick this if** your app sends password resets, receipts, or magic links and you want to compose them in JSX/TSX like a React component — not raw HTML tables from 2004. The 3k/mo free tier covers early-stage SaaS without thinking about cost, and the single-domain cap only hurts if you run multiple brands.

**vs Brevo** — Resend is pure transactional with a modern SDK; Brevo bundles marketing lists and campaigns you won't use yet. **vs SendGrid** — Resend's deliverability is comparable but the DX (React Email templates, instant logs) is a generation ahead of SendGrid's legacy dashboard.


---

## Brevo

| Field | Value |
|-------|-------|
| URL | https://www.brevo.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 300 emails/day |

Marketing + transactional in one forever-free tier.

**Pick this if** you need both drip campaigns (welcome sequences, newsletters) and transactional sends (order confirmations) from one platform without stitching two services together. The 300 emails/day forever-free tier is generous enough for a side-project that also wants to nurture a small subscriber list.

**vs Resend** — Brevo adds a full marketing automation UI; Resend is code-only transactional. **vs Loops** — Brevo is broader (CRM, SMS, chat) but less opinionated about SaaS lifecycle; Loops is purpose-built for product-led onboarding flows.


---

## Loops

| Field | Value |
|-------|-------|
| URL | https://loops.so |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 1k contacts free |

Product/lifecycle email for SaaS onboarding.

**Pick this if** you're building a SaaS and your emails are event-driven: "user signed up → send welcome", "trial day 3 → nudge to activate", "plan cancelled → win-back". Loops is designed around product events, not marketing blasts — the 1k contacts free tier fits pre-PMF perfectly.

**vs Brevo** — Loops speaks product events natively (user.signed_up, subscription.cancelled); Brevo forces you to map those into generic automation triggers. **vs Resend** — Resend is a pipe (send this template now); Loops owns the timing, segmentation, and sequence logic so you don't build it yourself.


---

## Tally / Formspark

| Field | Value |
|-------|-------|
| URL | https://tally.so |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Generous free form caps |

Drop-in forms without standing up a backend.

**Pick this if** you need a contact form, waitlist signup, or feedback widget on a static site or landing page and refuse to spin up an API just to receive a POST. Tally gives you a Notion-like form builder with unlimited submissions on free; Formspark is a minimal `<form action>` endpoint if you want full HTML control.

**vs Formspree** — Tally's free tier is far more generous (unlimited submissions vs 50/mo) and the builder is nicer; Formspree wins only if you need its plugin ecosystem or paid validations. **vs building your own** — a serverless function + DB costs $0 too, but takes an afternoon you could spend on your actual product.


---

## Twilio Trial

| Field | Value |
|-------|-------|
| URL | https://www.twilio.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Trial credit · numbers can be restricted · PAYG after |
| Tags | sms, voice |
| Verified | 2026-07-24 |

SMS/voice for OTP and alerts — trial credit, then meter hard.

**Pick this if** you need phone-number verification or SMS OTP codes and want the widest global carrier coverage with battle-tested docs. Twilio's trial credit lets you prototype the full flow for free; just know that after the credit burns you're paying per-message with no free floor.

**vs Vonage** — Twilio has superior documentation, broader SDK support, and more phone-number inventory in most countries. Choose Vonage only when Twilio can't provision a number in your target region or its per-message rate is notably worse there. **vs email OTP** — SMS adds real friction and cost; only use it when regulatory or UX requirements demand phone verification.


---

## Vonage (Nexmo)

| Field | Value |
|-------|-------|
| URL | https://www.vonage.com/communications-apis/ |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Signup credit crumbs · PAYG |
| Tags | sms |
| Verified | 2026-07-24 |

SMS/voice alternative when Twilio pricing or coverage is awkward.

**Pick this if** Twilio can't provision a local number in your target country, charges an unreasonable premium on a specific route, or you want a second vendor for failover. Vonage's API surface is comparable but the signup credit is stingy — treat it as a backup, not a default.

**vs Twilio** — Vonage occasionally wins on per-SMS pricing in APAC/EMEA corridors and has better WhatsApp Business API coverage in some regions; Twilio wins everywhere else on DX, docs, and ecosystem. **vs email-based OTP** — same trade-off as Twilio: only reach for SMS when a phone number is the trust anchor your product needs.


---

## Postmark

| Field | Value |
|-------|-------|
| URL | https://postmarkapp.com |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free trial / approval · not forever-free |
| Tags | transactional |
| Verified | 2026-07-24 |

Transactional email with serious deliverability — trial then paid.

**Pick this if** inbox placement is non-negotiable — invoices, security alerts, or anything where "check your spam folder" is unacceptable. Postmark's entire business model is deliverability-first (they reject bulk marketing senders). The catch: there's no forever-free tier, so use it once your product earns revenue or when you graduate from Resend/SendGrid's free caps.

**vs Resend** — Postmark has years of deliverability reputation data and dedicated IPs at lower volumes; Resend is newer but the free tier and DX are better for pre-revenue. **vs SendGrid** — Postmark's sending reputation is pristine because they refuse marketing mail; SendGrid's shared IPs are diluted by everyone else's newsletters.


---

## Twilio SendGrid

| Field | Value |
|-------|-------|
| URL | https://sendgrid.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free forever ~100 emails/day class · verify current Free plan |
| Tags | transactional |
| Verified | 2026-07-24 |

Legacy free forever email tier — still useful, watch reputation limits.

**Pick this if** you want a permanent free floor (~100 emails/day) for transactional sends and don't mind an older dashboard. SendGrid's free plan has survived multiple Twilio policy changes — verify it still exists before onboarding — but it works if you just need password resets and don't want to think about billing.

**vs Resend** — SendGrid has more email volume on free (100/day vs Resend's 100/day but 3k/mo cap), but Resend's developer experience, logging, and template tooling are dramatically better. **vs Postmark** — SendGrid is free; Postmark is paid. If you don't yet have revenue and can tolerate shared-IP reputation risk, SendGrid costs nothing.


---

## Formspree

| Field | Value |
|-------|-------|
| URL | https://formspree.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~50 submissions/mo · 1 form on free |
| Tags | forms |
| Verified | 2026-07-24 |

Form backend for static sites — email on submit without a server.

**Pick this if** you want a zero-JS form endpoint you can drop into any HTML page with a simple `action=` URL — no build step, no SDK, no client-side code required. The 50 submissions/mo free cap is tight, so this fits low-traffic pages like a portfolio contact form or an internal feedback widget.

**vs Tally** — Formspree is a raw HTTP endpoint (you own the HTML); Tally is a hosted form builder (you embed their UI). Pick Formspree when you want pixel-perfect form styling. **vs Formspark** — nearly identical concept; Formspree has a slightly richer plugin/integration layer, Formspark is simpler and cheaper at paid tiers.


---

## Forward Email

| Field | Value |
|-------|-------|
| URL | https://forwardemail.net |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Unlimited aliases free class · paid for outbound SMTP |
| Tags | oss, email |
| Verified | 2026-07-24 |

Privacy-first custom-domain email forwarding — free MX without a mailbox bill.

**Pick this if** you want `hello@yourdomain.com` to land in your personal Gmail/Proton without paying for Google Workspace or a hosted mailbox. Forward Email gives unlimited aliases on the free tier — perfect for receiving support@ or billing@ at your custom domain while keeping a single inbox.

**vs Cloudflare Email Routing** — both are free inbound forwarding; Forward Email is open-source and works with any DNS provider, while Cloudflare Email Routing requires your domain's nameservers on Cloudflare. **vs ImprovMX** — Forward Email's free tier is more generous (unlimited aliases vs 25) and the project is fully open-source with no tracking.


---
