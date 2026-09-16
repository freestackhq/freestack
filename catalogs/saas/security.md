---
category: Security
description: Security scanning, secret detection, and compliance.
order: 8
---

# Security

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Cloudflare Turnstile](#cloudflare-turnstile) | free forever | anyone | commercial ok | Free widget · generous request caps on free plan |
| [Better Auth](#better-auth) | free forever | anyone | commercial ok | OSS · self-host · your infra cost only |
| [SuperTokens](#supertokens) | free forever | anyone | commercial ok | Self-host free · managed free tier then paid |
| [WorkOS](#workos) | free forever | anyone | commercial ok | Free up to active-user thresholds · then usage |
| [Snyk Free](#snyk-free) | free forever | anyone | commercial ok | Free for open source / limited private tests · check current Free caps |
| [Socket.dev](#socket-dev) | free forever | anyone | commercial ok | Free tier for public / small private · paid for orgs |
| [Gitleaks](#gitleaks) | free forever | anyone | commercial ok | OSS CLI free · Gitleaks Cloud optional paid |
| [TruffleHog](#trufflehog) | free forever | anyone | commercial ok | OSS free · enterprise cloud paid |
| [Tailscale](#tailscale) | free forever | anyone | commercial ok | Personal free · 3 users / 100 devices class Free plan |
| [CrowdSec](#crowdsec) | free forever | anyone | commercial ok | OSS agent free · Console free tier then paid |
| [Let's Encrypt](#let-s-encrypt) | free forever | anyone | commercial ok | Rate limits per domain · 90-day certs |
| [Have I Been Pwned API](#have-i-been-pwned-api) | free forever | anyone | check ToS | Free Pwned Passwords API · paid for some enterprise feeds |
| [Bitwarden](#bitwarden) | free forever | anyone | commercial ok | Personal free · unlimited items/devices · orgs paid |

---

## Cloudflare Turnstile

| Field | Value |
|-------|-------|
| URL | https://www.cloudflare.com/products/turnstile/ |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free widget · generous request caps on free plan |
| Tags | bots |
| Verified | 2026-07-24 |

CAPTCHA alternative — bot checks without the UX tax.

**Pick this if** you need bot protection on forms or login without making real users solve puzzles. Invisible by default, free forever, and drops in with a few lines of JS.

**vs reCAPTCHA:** No Google tracking, no image grids, no user friction. Turnstile is invisible-first and doesn't sell attention to an ad network. **vs hCaptcha:** Both are privacy-friendlier than reCAPTCHA, but Turnstile is fully free (hCaptcha's publisher model pays *you* to annoy users) and requires zero user interaction in most cases.


---

## Better Auth

| Field | Value |
|-------|-------|
| URL | https://www.better-auth.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · self-host · your infra cost only |
| Tags | auth, oss |
| Verified | 2026-07-24 |

Open-source auth library — own the sessions, skip Clerk bill until you need hosted UI.

**Pick this if** you want full auth (email/password, OAuth, MFA) as a library you import — not a service you pay monthly. You control the database, the session store, and the upgrade path.

**vs Clerk / Auth0:** No per-MAU billing, no vendor dashboard you lose access to when the invoice bounces. You own the user table. **vs NextAuth/Auth.js:** Better Auth ships with built-in email+password, organization support, and a plugin system instead of forcing you to wire every provider callback manually.


---

## SuperTokens

| Field | Value |
|-------|-------|
| URL | https://supertokens.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Self-host free · managed free tier then paid |
| Tags | auth, oss |
| Verified | 2026-07-24 |

Open-source auth with optional managed cloud — self-host free.

**Pick this if** you want a self-hostable auth service with pre-built login UI, session management, and multi-tenancy — and the option to flip to managed hosting when ops becomes a drag.

**vs Better Auth:** SuperTokens is a standalone service (Docker container) with its own UI, while Better Auth is a library embedded in your app. Pick SuperTokens when you want auth as an independent microservice. **vs Keycloak:** Far lighter footprint, Node-native, modern React login UI out of the box. Keycloak is a Java monolith designed for enterprises with a dedicated IdP team.


---

## WorkOS

| Field | Value |
|-------|-------|
| URL | https://workos.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free up to active-user thresholds · then usage |
| Tags | sso, b2b |
| Verified | 2026-07-24 |

Enterprise SSO/SCIM when a B2B customer asks — free until you have orgs paying.

**Pick this if** your first enterprise customer asks "do you support SAML SSO?" and you need to say yes by next sprint. WorkOS handles the gnarly SAML/SCIM plumbing so you don't read XML at 2 AM.

**vs Auth0 Organizations:** WorkOS is purpose-built for B2B SSO/directory sync and charges nothing until your customers are actually paying you. Auth0 charges per-MAU from the start. **vs building it yourself:** SAML is a spec from 2005 that punishes you for reading it. WorkOS abstracts the IdP zoo (Okta, Entra, Google Workspace) behind one normalized API.


---

## Snyk Free

| Field | Value |
|-------|-------|
| URL | https://snyk.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free for open source / limited private tests · check current Free caps |
| Tags | sca |
| Verified | 2026-07-24 |

Dependency + container vuln scanning in CI before you ship known CVEs.

**Pick this if** you want a GitHub-integrated scanner that flags vulnerable dependencies in PRs and tells you which version fixes it. One `snyk test` in CI catches what `npm audit` misses.

**vs GitHub Dependabot:** Snyk covers more ecosystems (containers, IaC) and gives prioritized fix PRs with reachability analysis, not just "this dep has a CVE somewhere." **vs Socket.dev:** Snyk finds *known* CVEs in existing packages; Socket finds *malicious* packages and supply-chain anomalies. Run both — they solve different problems.


---

## Socket.dev

| Field | Value |
|-------|-------|
| URL | https://socket.dev |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free tier for public / small private · paid for orgs |
| Tags | sca |
| Verified | 2026-07-24 |

Supply-chain alerts for npm/pypi — catch malicious packages early.

**Pick this if** you install packages from npm/pypi and want to know *before* merge when a dependency starts exfiltrating env vars, spawns install scripts, or was published by a hijacked maintainer account.

**vs Snyk:** Snyk alerts on known CVEs (reactive); Socket alerts on suspicious package *behavior* like network calls in postinstall or obfuscated code (proactive). They're complementary. **vs `npm audit`:** npm audit only checks the advisory database. Socket does static analysis of package contents to catch zero-day supply-chain attacks that have no CVE yet.


---

## Gitleaks

| Field | Value |
|-------|-------|
| URL | https://gitleaks.io |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS CLI free · Gitleaks Cloud optional paid |
| Tags | secrets, oss |
| Verified | 2026-07-24 |

Secret scanning in git history — run in pre-commit and CI.

**Pick this if** you want a fast, single-binary scanner that catches leaked API keys, tokens, and passwords in pre-commit hooks (before they hit the remote) *and* in CI (to block PRs that slip through).

**vs TruffleHog:** Gitleaks is lighter and faster for pre-commit hooks — it's the gate. TruffleHog is heavier, verifies secrets against live APIs, and is better for deep audits of existing history. Use Gitleaks to prevent, TruffleHog to discover. **vs GitHub Secret Scanning:** GitHub only scans after push and only for partner-pattern secrets. Gitleaks catches everything locally before it ever leaves your machine.


---

## TruffleHog

| Field | Value |
|-------|-------|
| URL | https://trufflesecurity.com/trufflehog |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS free · enterprise cloud paid |
| Tags | secrets, oss |
| Verified | 2026-07-24 |

Deep secret hunting across repos and history — verify before you rotate everything.

**Pick this if** you're auditing an existing codebase (or an acquired one) and need to know exactly which leaked secrets are *still valid* — TruffleHog verifies findings against live APIs so you only rotate what's actually exploitable.

**vs Gitleaks:** TruffleHog's killer feature is live secret verification (it checks if a found AWS key is active). Gitleaks is faster for pre-commit gating but doesn't verify. Use TruffleHog for periodic deep scans, Gitleaks for real-time prevention. **vs GitHub Secret Scanning:** TruffleHog scans any git remote, S3 buckets, Slack, Confluence — not just GitHub repos.


---

## Tailscale

| Field | Value |
|-------|-------|
| URL | https://tailscale.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Personal free · 3 users / 100 devices class Free plan |
| Tags | vpn, homelab |
| Verified | 2026-07-24 |

Zero-config mesh VPN for homelab, staging, and private admin panels.

**Pick this if** you have admin panels, databases, or staging environments that should never touch the public internet. Install on each machine, they see each other — no port forwarding, no firewall rules, no VPN server to maintain.

**vs Netbird:** Both are WireGuard mesh overlays. Tailscale has a slicker UX, better docs, and MagicDNS. Netbird is fully self-hostable (no vendor control plane). Pick Tailscale for fastest setup; pick Netbird if you refuse to trust any third-party coordination server. **vs traditional VPN (OpenVPN/WireGuard manual):** No central gateway bottleneck, no config file distribution, no NAT traversal headaches. Tailscale is peer-to-peer and auto-punches through NAT.


---

## CrowdSec

| Field | Value |
|-------|-------|
| URL | https://www.crowdsec.net |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS agent free · Console free tier then paid |
| Tags | ids, oss |
| Verified | 2026-07-24 |

Collaborative IDS — block noisy scanners without a WAF invoice.

**Pick this if** you self-host services and want to automatically ban IPs that brute-force SSH, probe admin paths, or spam login forms — using crowd-sourced blocklists from other CrowdSec users running the same stack.

**vs Fail2ban:** CrowdSec parses the same logs but shares threat intel globally — you benefit from every other operator's bans, not just your own observations. Also faster (Go vs Python) and has a proper API/dashboard. **vs Cloudflare WAF:** CrowdSec protects origin servers directly (SSH, SMTP, game servers — anything with logs), doesn't require proxying traffic through a third party, and costs $0.


---

## Let's Encrypt

| Field | Value |
|-------|-------|
| URL | https://letsencrypt.org |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Rate limits per domain · 90-day certs |
| Tags | tls |
| Verified | 2026-07-24 |

Free TLS certificates — boring, required, still the default.

**Pick this if** you run any web service and need TLS without paying for it. Pair with certbot or Caddy's auto-HTTPS and forget about it. There is no reason to serve HTTP in 2026.

**vs Cloudflare Universal SSL:** Let's Encrypt works on any origin you control (not just Cloudflare-proxied domains). Use it when you need certs for non-HTTP services (mail, MQTT) or when you're not fronted by Cloudflare. **vs paid CAs (DigiCert, Sectigo):** Unless you need EV/OV certificates for regulatory compliance, Let's Encrypt DV certs are functionally identical in the browser. Save the $200/yr.


---

## Have I Been Pwned API

| Field | Value |
|-------|-------|
| URL | https://haveibeenpwned.com/API/Key |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free Pwned Passwords API · paid for some enterprise feeds |
| Tags | passwords |
| Verified | 2026-07-24 |

Check passwords / emails against breach corpora (k-anonymity range API).

**Pick this if** you have a signup or password-change flow and want to reject passwords that already appear in public breach dumps — without sending the actual password to any third party (the k-anonymity API only sends a hash prefix).

**vs NIST 800-63B word lists:** HIBP's Pwned Passwords corpus is 900M+ real-world breached passwords, far larger than any static dictionary. It catches "P@ssw0rd123!" that a complexity rule would accept. **vs rolling your own bloom filter:** The HIBP range API is 1 HTTP call, no local storage, no update pipeline. You get breach coverage without shipping a multi-GB dataset.


---

## Bitwarden

| Field | Value |
|-------|-------|
| URL | https://bitwarden.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Personal free · unlimited items/devices · orgs paid |
| Tags | oss, secrets |
| Verified | 2026-07-24 |

OSS password manager — personal free forever, self-host when you want.

**Pick this if** you need a team or personal password vault that works across every platform, syncs securely, and doesn't lock your data behind a proprietary format. Self-host with Vaultwarden for full control at zero cost.

**vs 1Password:** Bitwarden is open-source and has a real free tier (unlimited items, unlimited devices). 1Password has better UX polish but costs $3+/mo and is closed-source. **vs KeePass:** Bitwarden syncs natively across devices with a proper server component. KeePass requires you to rig your own sync (Dropbox/Syncthing) and the UX hasn't been updated since 2005.


---
