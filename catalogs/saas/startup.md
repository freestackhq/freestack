---
category: Startup lean
description: Startup-lean credits and programs.
order: 11
---

# Startup lean

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [AWS Activate](#aws-activate) | credits | anyone | commercial ok | $1k–$100k+ depending on path · expires |
| [Google for Startups Cloud](#google-for-startups-cloud) | credits | anyone | commercial ok | Program credits vary · application required |
| [Microsoft for Startups](#microsoft-for-startups) | credits | anyone | commercial ok | Application + eligibility · credit packages vary |
| [Stripe Atlas](#stripe-atlas) | discount | anyone | commercial ok | One-time fee · not a free tier |
| [Clerk (startup path)](#clerk-startup-path) | free forever | anyone | commercial ok | 50k MRU free · then paid |
| [PostHog](#posthog) | free forever | anyone | commercial ok | ~1M events/mo free across products |
| [Plausible / Umami](#plausible-umami) | free forever | anyone | commercial ok | Umami Cloud free tier · Plausible paid (or self-host) |
| [Cal.com](#cal-com) | free forever | anyone | commercial ok | Free cloud plan · self-host unlimited |
| [Crisp / Chatwoot](#crisp-chatwoot) | free forever | anyone | commercial ok | Crisp free tier · Chatwoot OSS |
| [Linear](#linear) | free forever | anyone | commercial ok | Free for small teams · startup programs exist |
| [Notion (team)](#notion-team) | free forever | student helps | commercial ok | Free plan solid · student Plus via Edu |
| [Loom / Screen Studio lite paths](#loom-screen-studio-lite-paths) | free forever | anyone | check ToS | Loom free caps · or OBS + R2 for $0 hosting |
| [Paddle / Lemon Squeezy](#paddle-lemon-squeezy) | discount | anyone | commercial ok | Fee % of revenue · no monthly until you sell |
| [Plain / Freshdesk Lite](#plain-freshdesk-lite) | free forever | anyone | commercial ok | Free tiers / trials · graduate when ticket volume hurts |
| [Fly.io](#fly-io) | credits | anyone | commercial ok | No classic free tier for new accounts · small bills if sized right |
| [HTMX + Go/Python SSR](#htmx-go-python-ssr) | free forever | anyone | commercial ok | Open source · pairs with Cloudflare/Koyeb/Oracle |
| [Intercom](#intercom) | discount | anyone | commercial ok | Limited free/trial · expensive at seat scale · anti-reco for day-0 |

---

## AWS Activate

| Field | Value |
|-------|-------|
| URL | https://aws.amazon.com/activate/ |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | $1k–$100k+ depending on path · expires |
| Tags | credits, must-claim |

Startup cloud credits — apply via accelerator/partner or Activate Founders.

**Pick this if** your production infra is already on AWS (or will be) and you need runway to defer cloud bills for 12–24 months. The credits burn on anything — EC2, RDS, Bedrock — so they're most valuable when you'd otherwise be paying cash for compute-heavy workloads. **vs Google for Startups:** AWS credits cover more SKUs but require an accelerator/partner voucher for the big packages; GCP gives similar amounts with a simpler solo-founder application. **vs Azure:** AWS ecosystem is deeper for startups shipping containers + managed Postgres; Azure wins if your stack is .NET or you want bundled OpenAI credits.


---

## Google for Startups Cloud

| Field | Value |
|-------|-------|
| URL | https://cloud.google.com/startup |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Program credits vary · application required |
| Tags | credits |

GCP credits for eligible startups — pair with Skills Boost for learning.

**Pick this if** you're building on BigQuery, Vertex AI, or Cloud Run and want $2k–$200k in credits without needing an accelerator sponsor. Google's application is friendlier to solo founders and pre-revenue teams than AWS Activate's partner path. **vs AWS Activate:** easier solo application, but GCP's managed-service catalog is thinner outside data/ML; if you're mostly running containers + Postgres, AWS has more battle-tested defaults. **vs Azure:** GCP wins for data pipelines and ML-native workloads; Azure wins for enterprise identity (Entra ID) and OpenAI API access bundled in.


---

## Microsoft for Startups

| Field | Value |
|-------|-------|
| URL | https://www.microsoft.com/en-us/startups |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Application + eligibility · credit packages vary |
| Tags | credits |

Azure credits + GitHub/OpenAI perks for accepted startups.

**Pick this if** your product depends on OpenAI models (GPT-4, embeddings) or your customers live in Microsoft-land (Teams integrations, Entra ID SSO). The bundled GitHub Enterprise + Azure OpenAI access is uniquely valuable for AI-first startups that need production-grade rate limits day one. **vs AWS Activate:** Azure credits are smaller on average but the OpenAI + GitHub bundle is unmatched; AWS wins on raw infra breadth and community tooling. **vs Google for Startups:** pick Azure when you need GPT-family models or .NET hosting; pick GCP when your differentiator is data/ML pipelines on Vertex.


---

## Stripe Atlas

| Field | Value |
|-------|-------|
| URL | https://stripe.com/atlas |
| Cost | discount |
| Student | anyone |
| Commercial | commercial ok |
| Limits | One-time fee · not a free tier |
| Tags | ops |

Incorporate + bank + Stripe in one path — not free, but fewer lawyers early.

**Pick this if** you're a non-US founder (or just hate paperwork) and want a Delaware C-Corp + bank account + payment processing live in under two weeks without hiring a lawyer. The $500 one-time fee pays for itself in avoided legal hours. **vs Firstbase/Doola:** Atlas is tighter integrated with Stripe payments and has the largest partner-perk network (AWS credits, Notion, etc.); competitors offer more hand-holding on tax filings but cost more annually. **vs DIY (Clerky + Mercury):** DIY is cheaper upfront if you already have a US address and can self-file; Atlas wins on speed and bundled perks when you're moving fast.


---

## Clerk (startup path)

| Field | Value |
|-------|-------|
| URL | https://clerk.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 50k MRU free · then paid |
| Tags | auth |

Auth that ships — stay on free MAU until you have users worth billing.

**Pick this if** you want polished auth UI (sign-in, user profile, org switcher) shipped in hours instead of days, and you're building with Next.js/React. Clerk's component library and webhook system let you skip writing auth plumbing entirely until 50k monthly active users. **vs Auth0/Okta:** Clerk's DX is years ahead for small teams — embeddable components, simpler pricing, no "contact sales" cliff until you're well-funded; Auth0 wins when you need enterprise SAML/SCIM on day one. **vs Supabase Auth / Firebase Auth:** those are cheaper (free) but give you a bare JWT — you still build every UI and session flow yourself; Clerk trades some lock-in for shipping velocity.


---

## PostHog

| Field | Value |
|-------|-------|
| URL | https://posthog.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~1M events/mo free across products |
| Tags | analytics |

Product analytics without a $enterprise contract — free until you scale events.

**Pick this if** you need session replays, feature flags, A/B tests, AND funnels in one tool and refuse to duct-tape Mixpanel + LaunchDarkly + Hotjar together. PostHog's all-in-one surface means one SDK, one billing meter, one data model to reason about. **vs Mixpanel/Amplitude:** PostHog is warehouse-native and self-hostable; Mixpanel has slightly better collaboration UX for non-technical PMs but costs more per event and locks data in their cloud. **vs Plausible/Umami:** PostHog is for *product* analytics (who clicked what, where they churned); Plausible is for *traffic* analytics (pageviews, referrers) — use Plausible for your marketing site, PostHog for your app.


---

## Plausible / Umami

| Field | Value |
|-------|-------|
| URL | https://umami.is |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Umami Cloud free tier · Plausible paid (or self-host) |
| Tags | analytics |

Privacy-first analytics when PostHog is overkill for a brochure site.

**Pick this if** you only need pageviews, referrers, and country breakdowns for a marketing site or docs — and you want a <1 KB script that doesn't trigger cookie banners. Perfect when GDPR compliance matters more than funnel analysis. **vs PostHog:** Plausible/Umami show you *traffic*; PostHog shows you *product behavior*. Don't shoehorn PostHog onto a landing page, and don't expect Umami to tell you where users drop off in onboarding. **vs Google Analytics:** GA4 is free but bloated, cookie-dependent, and feeds Google's ad network — Plausible/Umami give you clean numbers without the privacy trade-off or the learning curve of GA4's data model.


---

## Cal.com

| Field | Value |
|-------|-------|
| URL | https://cal.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free cloud plan · self-host unlimited |
| Tags | ops |

Scheduling without Calendly tax — self-host or free cloud seats.

**Pick this if** you book demos, interviews, or support calls and refuse to pay $12+/seat/mo for what is essentially a calendar link. Cal.com's free tier covers one calendar + one event type per user, and self-hosting removes all limits. **vs Calendly:** Cal.com is open-source with identical core features (round-robin, collective, workflows) — Calendly only wins on polished integrations (Salesforce, HubSpot) that you don't need pre-PMF. **vs SavvyCal:** SavvyCal has prettier recipient-side UX but no free tier and no self-host option; pick it only if scheduling UX is your competitive moat (it isn't).


---

## Crisp / Chatwoot

| Field | Value |
|-------|-------|
| URL | https://www.chatwoot.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Crisp free tier · Chatwoot OSS |
| Tags | support |

Customer chat on a budget — Chatwoot self-host if you want $0.

**Pick this if** users expect a chat widget in your app and you want to respond from one inbox (not scattered Slack DMs). Chatwoot self-hosted is truly $0 with unlimited agents; Crisp's free tier works if you have ≤2 agents and don't want to run infra. **vs Intercom:** Intercom is 10x the price and 10x the feature bloat — you don't need AI bots, product tours, and a CDP when you have 50 users; Chatwoot/Crisp cover live chat + email inbox which is all that matters pre-scale. **vs Freshdesk:** Freshdesk is ticket-first (email/forms); Crisp/Chatwoot are chat-first (widget). Pick based on whether your users expect real-time replies or async tickets.


---

## Linear

| Field | Value |
|-------|-------|
| URL | https://linear.app |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free for small teams · startup programs exist |
| Tags | ops |

Issue tracking that teams actually use — free for small startups.

**Pick this if** your team has 2–10 engineers and you want issue tracking that's fast enough that people actually update tickets instead of ignoring them. Linear's keyboard-first UX and opinionated workflows (cycles, triage) reduce process overhead to near zero. **vs Jira:** Jira is where velocity goes to die — it's configurable to the point of paralysis and optimized for enterprise reporting, not shipping. Linear is the anti-Jira. **vs GitHub Issues/Projects:** fine for OSS or solo devs, but GitHub Projects lacks cycles, priorities, triage queues, and the speed that makes Linear sticky for teams. Graduate to Linear once you have >1 person.


---

## Notion (team)

| Field | Value |
|-------|-------|
| URL | https://www.notion.so |
| Cost | free forever |
| Student | student helps |
| Commercial | commercial ok |
| Limits | Free plan solid · student Plus via Edu |
| Tags | ops |

Docs + wiki — Free/Plus until you need SAML; don't buy Enterprise early.

**Pick this if** you need one place for specs, meeting notes, onboarding docs, and lightweight project tracking — and your team already thinks in Notion. The free plan is generous for small teams; students get Plus via .edu email. **vs Confluence:** Confluence is Jira's sidekick — if you're not on Atlassian, there's zero reason to use it. Notion is faster to write in, prettier to read, and doesn't require an admin cert to configure. **vs Slite/Coda:** Slite is simpler but less powerful; Coda is more powerful but harder to learn. Notion sits in the sweet spot for 90% of startup wiki needs. Don't overthink this one.


---

## Loom / Screen Studio lite paths

| Field | Value |
|-------|-------|
| URL | https://www.loom.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Loom free caps · or OBS + R2 for $0 hosting |
| Tags | ops |

Async demos for sales and support without a video team.

**Pick this if** you close deals or resolve support tickets faster with a 2-minute screen recording than a 30-minute call. Loom's free tier (25 videos, 5 min each) covers early sales; for polished product demos, Screen Studio (macOS, one-time $89) gives you Apple-keynote-quality zoom animations without After Effects. **vs writing a doc:** a 90-second Loom replaces a 500-word email and gets watched 3x more often. Use it for anything where "let me show you" beats "let me explain." **vs OBS + R2 self-host:** $0 but no viewer analytics, no comments, no auto-transcripts. Fine for internal walkthroughs; use Loom when you need to know if the prospect actually watched.


---

## Paddle / Lemon Squeezy

| Field | Value |
|-------|-------|
| URL | https://www.lemonsqueezy.com |
| Cost | discount |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Fee % of revenue · no monthly until you sell |
| Tags | payments |

Merchant of record — taxes/VAT handled so you can sell globally early.

**Pick this if** you sell to consumers or small businesses worldwide and refuse to register for VAT in 30 countries. A merchant of record (MoR) is the legal seller — they handle sales tax, VAT, invoicing, and refunds. You get a net payout. Worth the 5% fee to avoid tax compliance nightmares on day one. **vs Stripe direct:** Stripe is a payment processor, not a MoR — *you* are still liable for tax collection and remittance. Use Stripe when you only sell B2B in one country or have a tax tool (Avalara) already. **vs Paddle vs Lemon Squeezy:** Paddle is more mature (subscription dunning, retention tools); Lemon Squeezy is simpler and better for digital products / info products. Pick Lemon Squeezy for solo-founder simplicity, Paddle for SaaS with seat-based billing.


---

## Plain / Freshdesk Lite

| Field | Value |
|-------|-------|
| URL | https://www.plain.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free tiers / trials · graduate when ticket volume hurts |
| Tags | support |

Support inbox when Discord DMs stop scaling.

**Pick this if** you've outgrown "check Discord/email manually" and need a shared inbox with assignment, status tracking, and SLA timers — but you're not ready to pay Intercom prices. Plain is developer-first (API-native, thread-based); Freshdesk Lite is more traditional (ticket queue, canned responses, knowledge base). **vs Intercom:** Plain/Freshdesk cost $0–$15/agent vs Intercom's $39+/seat — and you don't need chatbots, product tours, or a CDP at this stage. **vs Crisp/Chatwoot:** those are chat-widget-first; Plain/Freshdesk are inbox/ticket-first. Pick based on your support model: real-time widget conversations → Crisp; async email/form tickets → Plain or Freshdesk.


---

## Fly.io

| Field | Value |
|-------|-------|
| URL | https://fly.io |
| Cost | credits |
| Student | anyone |
| Commercial | commercial ok |
| Limits | No classic free tier for new accounts · small bills if sized right |
| Tags | hosting |

Global VMs near users — PAYG after free allowances changed; still lean vs hyperscale.

**Pick this if** you need your backend within 50ms of users in multiple regions and don't want to learn Terraform + VPCs to get there. Fly gives you Firecracker VMs with a `fly deploy` and handles Anycast, TLS, and private networking. Best for latency-sensitive APIs, real-time apps, or SQLite-on-the-edge patterns. **vs Railway/Render:** Railway and Render are simpler (git-push deploy) but single-region by default; Fly wins when multi-region latency matters. **vs AWS/GCP:** hyperscalers give you infinite knobs but cost $0 in brainpower only if you already know them; Fly trades some flexibility for "deploy globally in 5 minutes" simplicity at <$10/mo for small apps.


---

## HTMX + Go/Python SSR

| Field | Value |
|-------|-------|
| URL | https://htmx.org |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Open source · pairs with Cloudflare/Koyeb/Oracle |
| Tags | architecture |
| Verified | 2026-07-24 |

Skip SPA tax until product-market fit — fewer JS bundles, cheaper hosting.

**Pick this if** your app is CRUD-heavy (dashboards, admin panels, internal tools) and you'd rather ship features than fight React hydration, bundle splitting, and state management. HTMX gives you dynamic UI with server-rendered HTML — no build step, no node_modules, no client-side router. Pair with Go (fast, single binary) or Python/Django (fast iteration, batteries included). **vs Next.js/React SPA:** SPAs win when you need rich offline interactions, real-time collaborative editing, or complex client state (Figma, Notion). For 80% of B2B SaaS, HTMX + SSR is faster to build, faster to load, and cheaper to host. **vs Laravel/Rails:** same philosophy (server-rendered, productive) — pick Go/Python HTMX if you want lighter deployments (single binary or container) without a full framework's opinions.


---

## Intercom

| Field | Value |
|-------|-------|
| URL | https://www.intercom.com |
| Cost | discount |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Limited free/trial · expensive at seat scale · anti-reco for day-0 |
| Tags | support, anti-reco |
| Verified | 2026-07-24 |

Support suite — free crumbs exist; paywall hits fast. Prefer Chatwoot early.

**Pick this if** you have PMF, paying customers, and a support team of 3+ — and you need AI bots, product tours, in-app messaging, and a help center in one integrated platform. Intercom is genuinely good *at scale*; it's just wildly expensive and overpowered for a pre-revenue startup. Do not start here on day zero. **vs Chatwoot/Crisp:** Chatwoot at $0 covers 95% of what you need pre-Series A. Switch to Intercom when you need AI resolution bots, proactive messaging campaigns, or your support volume justifies the $39+/seat/mo cost. **vs Zendesk:** both are enterprise-grade; Intercom is more product-led (in-app messenger), Zendesk is more ticket-led (email/phone). Neither belongs in your stack until you have revenue to burn.


---
