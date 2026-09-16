---
category: Auth & secrets
description: Auth, identity, and secrets management.
order: 3
---

# Auth & secrets

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Clerk](#clerk) | free forever | anyone | commercial ok | 50k MRU |
| [Kinde](#kinde) | free forever | anyone | commercial ok | ~10.5k MAU |
| [Doppler](#doppler) | free forever | anyone | commercial ok | 5 users free · Team free via GitHub Pack while student |
| [Hookdeck](#hookdeck) | free forever | anyone | commercial ok | 100k events/mo · 3-day retention |
| [Infisical](#infisical) | free forever | anyone | commercial ok | Free cloud tier for secrets sync |
| [Zitadel](#zitadel) | free forever | anyone | commercial ok | ~25k MAU free cloud · OSS self-host unlimited |

---

## Clerk

| Field | Value |
|-------|-------|
| URL | https://clerk.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 50k MRU |

Pre-built auth UI for B2B/B2C.

**Pick this if** you want auth working in an afternoon, not a weekend — drop-in `<SignIn/>` components, hosted account portal, and you never write a password-reset flow again. 50 k monthly active users before you pay a cent means most indie projects never outgrow free.

**vs Kinde:** Clerk's UI components are richer out-of-the-box (pre-styled modals, user profile pages); Kinde bundles feature flags and SSO at the same tier so you install fewer vendors. Pick Clerk for speed-to-ship; pick Kinde if you also need flags/SSO without another tool.
**vs Zitadel:** Clerk is a managed-only service — zero ops, but you can't self-host. Zitadel gives you an OSS escape hatch and 25 k MAU free, but you build your own login UI.


---

## Kinde

| Field | Value |
|-------|-------|
| URL | https://kinde.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~10.5k MAU |

Auth with SSO and feature flags.

**Pick this if** you need auth, enterprise SSO, and feature flags from one vendor so you're not duct-taping Clerk + LaunchDarkly together. Kinde's free tier (~10.5 k MAU) is lower than Clerk's, but the bundled flags and RBAC make it the better consolidated choice for B2B SaaS that will need "is this feature enabled for org X?" logic from day one.

**vs Clerk:** Kinde trades Clerk's polished UI kit for built-in feature flags, roles, and SSO — fewer vendors, but you'll style your own login screens. Pick Kinde when your app needs gating and org-level access control early; pick Clerk when pixel-perfect auth UX matters more than bundled infra.


---

## Doppler

| Field | Value |
|-------|-------|
| URL | https://www.doppler.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 5 users free · Team free via GitHub Pack while student |

Secrets sync to Vercel, Koyeb, Railway.

**Pick this if** your stack spans multiple deploy targets (Vercel preview + Railway prod + local dev) and you're tired of copy-pasting `.env` values between dashboards. Doppler becomes the single source of truth for secrets and syncs them to each target automatically — one `doppler run` replaces a pile of `.env` files.

**vs Infisical:** Doppler is polished SaaS with first-class integrations for Vercel/Railway/Fly; Infisical is open-source and self-hostable. Pick Doppler for zero-ops secret sync across commercial PaaS; pick Infisical if you want an auditable OSS layer you control or need to avoid vendor lock-in on secrets.


---

## Hookdeck

| Field | Value |
|-------|-------|
| URL | https://hookdeck.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | 100k events/mo · 3-day retention |

Webhook ingest with retries and queues.

**Pick this if** you receive webhooks from Stripe/Clerk/GitHub and need guaranteed delivery without writing your own retry queue. Hookdeck sits in front of your endpoint, buffers events, retries failures with backoff, and gives you a replay UI — 100 k events/mo free is plenty for indie SaaS webhook traffic.

**vs rolling your own:** A custom Bull/Redis queue gives you full control but costs a VPS and maintenance. Hookdeck is zero-infra: point the provider's webhook URL at Hookdeck, point Hookdeck at your app, and get retries + observability for free. Pick Hookdeck until your event volume or latency needs outgrow the managed tier.


---

## Infisical

| Field | Value |
|-------|-------|
| URL | https://infisical.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free cloud tier for secrets sync |

Open-source Doppler alternative.

**Pick this if** you want secret management you can audit, fork, and self-host — no vendor can pull the rug on your secrets infra. Infisical's cloud free tier works like Doppler (env sync, integrations), but you also get the option to run it on your own box for compliance or air-gapped setups.

**vs Doppler:** Infisical is OSS-first — you can self-host, audit the code, and avoid proprietary lock-in. Doppler has slicker PaaS integrations (one-click Vercel sync) and a more polished CLI UX. Pick Infisical when sovereignty and self-host matter; pick Doppler when you just want secrets to flow to managed platforms with zero ops.


---

## Zitadel

| Field | Value |
|-------|-------|
| URL | https://zitadel.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | ~25k MAU free cloud · OSS self-host unlimited |
| Tags | oss, idp |
| Verified | 2026-07-24 |

Cloud-native IdP with passkeys and multi-tenancy — Clerk alternative.

**Pick this if** you want a full identity provider (OIDC/SAML/passkeys) you can self-host long-term without per-MAU pricing cliffs. Zitadel's free cloud gives you 25 k MAU to validate, and the OSS binary means you can move to your own infra when margins matter — no rewrite, same API.

**vs Clerk:** Zitadel is an IdP you own; Clerk is a widget you rent. Clerk ships faster (drag-and-drop UI), but Zitadel gives you protocol-level control (custom OIDC scopes, SAML federation, machine-to-machine tokens) and no hard vendor ceiling. Pick Zitadel for multi-tenant B2B that will eventually need self-hosted auth; pick Clerk if you want login done in a day and won't self-host.


---
