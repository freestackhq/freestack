# Link report, 2026-11-13

First run of `pnpm ops:link-check` (HEAD then GET, redirects followed, 10 s timeout, 4 at a time, one retry). State: `data/state/links.yaml`. Nothing in `data/tools/` was changed. This report is for a person to decide.

## Totals

| Set | ok | redirected | 4xx | 5xx | timeout | blocked | dns | other error |
|---|---|---|---|---|---|---|---|---|
| Labeled `url` (205) | 187 | 11 | 1 | 0 | 0 | 4 | 1 | 1 |
| Labeled `pricing_url` (205, all equal to `url`) | 187 | 11 | 1 | 0 | 0 | 4 | 1 | 1 |
| Imported `url`, before clean-up (120) | 97 | 9 | 3 | 1 | 4 | 3 | 1 | 2 |
| Imported `url`, after clean-up (112) | 98 | 7 | 2 | 1 | 3 | 0 | 0 | 1 |

"Blocked" (401, 403, 429, Cloudflare challenge) and "timeout" mean unknown, not dead.

## Labeled tools that look dead

Both have a first strike (`failing_since: 2026-11-13`). The next weekly run sets `dead_since` if they still fail, and the label gets `link_dead`. They stay listed until someone decides.

| Tool | Link | Evidence | Proposal |
|---|---|---|---|
| `abakada` (campus) — **removed 2026-11-13**, 301s to /campus | https://github.com/Abakada-org/abakada | 404. The `Abakada-org` org exists, but its only public repo is `abakada-site` (last push 2026-03-20). | Find the new home. If it moved, update `url`/`pricing_url` and recheck the label. If it's gone, remove the tool and add `{ id: abakada, aisle: campus }` to `data/removed.yaml` so `/campus/abakada` 301s to the aisle. |
| `deped-commons` (campus) — **removed 2026-11-13**, 301s to /campus | https://commons.deped.gov.ph/ | DNS: no record for `commons.deped.gov.ph`. `www.deped.gov.ph` is up. | Check whether DepEd moved Commons. If not found, remove it and add `{ id: deped-commons, aisle: campus }` to `data/removed.yaml`. |

## Labeled tools that moved (alive, for a recheck)

The product answers on another domain. Not dead. Worth updating `url`/`pricing_url` on the next label check, and checking whether the free offer changed.

| Tool | From | To | Note |
|---|---|---|---|
| `windsurf` | https://windsurf.com | https://devin.ai/desktop | Windsurf now lands on "Devin Desktop". The free offer may have changed. Recheck first. |
| `frontend-masters-pack` | https://frontendmasters.com | https://master.dev/ | Page says Frontend Masters became Master.dev. |
| `twilio-sendgrid` | https://sendgrid.com | https://www.twilio.com/en-us/sendgrid | |
| `anthropic-api` | https://console.anthropic.com | https://platform.claude.com/ | |
| `vercel-ai-sdk` | https://sdk.vercel.ai | https://ai-sdk.dev/ | |
| `neon` | https://neon.tech | https://neon.com/ | |
| `railway` | https://railway.app | https://railway.com/ | |
| `livekit-cloud` | https://livekit.io | https://livekit.com/ | |
| `frankfurter` | https://www.frankfurter.app/docs | https://frankfurter.dev/ | |
| `elbi-gradesim` | https://gradesim.uplbtools.me/ | https://gradesim.uplb.tools/ | |
| `room-tba` | https://room-tba.uplbtools.me/ | https://room-tba.uplb.tools/ | |

## Labeled tools we could not judge

| Tool | Result | Note |
|---|---|---|
| `milvus` | redirect loop | https://milvus.io loops for a cookie-less client. Likely fine in a browser. |
| `cryptocompare` | 401 | `min-api.cryptocompare.com/documentation` answers "API key required" and points to developers.coindesk.com. The docs link may need a new home. |
| `mistral` | 401 | Console needs sign-in. Consider the product page as `url`. |
| `namecheap-me-pack` | 403 | Bot wall. |
| `perplexity-pro-student` | 403 | Bot wall. |

## Imported entries removed

Removed through `data/imported/denylist.yaml` (reason and date per line) and a re-run of `pnpm import:lists` at the pinned commits, so the next import doesn't bring them back.

| Id | List | Evidence |
|---|---|---|
| `elephantsql` | stack-on-a-budget | Homepage is a "Service discontinued" notice. |
| `fauna` | stack-on-a-budget | Fauna shut down its service in 2025. `fauna.com` times out on connect. |
| `visual-studio-mobile-center` | stack-on-a-budget | Lands on App Center docs, which Microsoft retired. |
| `openshift-mongodb` | stack-on-a-budget | Redirects to the OpenShift Online life cycle page: end of life. |
| `sawo-labs` | public-apis | Domain redirects to an unrelated product (trybrowserling.com). |
| `serverless-cloud` | free-for-life | 404. Product discontinued. |
| `pepipost` | free-for-life | Connection refused on http and https. |
| `kluster-ai` | awesome-free-llm-apis-amar | `kluster.ai` redirects to `www.kluster.ai`, which has no DNS record. |

## Imported entries pointed at the product

47 imported URLs pointed at a pricing page or an API-key console. The importer now points them at the product: consoles go to the vendor's root (`platform.agnes-ai.com/settings/apiKeys` -> `agnes-ai.com`), pricing pages to the site root (`descope.com/pricing` -> `descope.com`), and shared vendors to the page above (`aws.amazon.com/cognito/pricing/` -> `aws.amazon.com/cognito/`). All rewritten URLs answered ok.

## Imported entries left for the next run

| Id | Result | Note |
|---|---|---|
| `github-models` | 404 | `github.com/marketplace/models` is gone; the product lives at `github.com/marketplace?type=models`. Fix upstream in the list, or it drops out after a second strike. |
| `sendinblue` | 404 | Sendinblue is now Brevo (`brevo.com` is up). Same: fix upstream or it drops out. |
| `glhf-chat` | 526 | Origin TLS broken behind Cloudflare. Unknown. |
| `takeout` | expired TLS cert | Unknown. |
| `alwaysdata`, `brewpage`, `openclaw-ai` | timeout | Unknown. `alwaysdata` is a known live host. |
| `datastax-astra-cassandra`, `kinsta-static-site-hosting`, `sparkpost`, `ory`, `para`, `atomic-mail`, `storj` | redirected | Rebrands or acquisitions (IBM, Sevalla, Bird, ory.com). Alive. |
