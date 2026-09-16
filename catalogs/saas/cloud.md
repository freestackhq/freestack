---
category: Cloud credits
description: Cloud credit programs.
order: 14
---

# Cloud credits

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [DigitalOcean (Pack)](#digitalocean-pack) | credits | student required | commercial ok | ~$200 windows · check GPU exclusions / expiry |
| [Heroku (Pack)](#heroku-pack) | credits | student required | commercial ok | $13/mo × 24 months |
| [MongoDB Atlas Credits (Pack)](#mongodb-atlas-credits-pack) | credits | student required | commercial ok | $50 credits + free University cert path |
| [AWS Educate](#aws-educate) | credits | student helps | edu only | Lab credits vary by path |
| [Namecheap .me (Pack)](#namecheap-me-pack) | student free | student required | commercial ok | 1 yr .me + SSL · renew paid later |

---

## DigitalOcean (Pack)

| Field | Value |
|-------|-------|
| URL | https://www.digitalocean.com |
| Cost | credits |
| Student | student required |
| Commercial | commercial ok |
| Limits | ~$200 windows · check GPU exclusions / expiry |

Platform credit for droplets and App Platform.

**Pick this if** you want real Linux VMs (droplets) you fully control — SSH in, install anything, run Docker — or a simple App Platform deploy with zero Kubernetes overhead. Best bang-per-credit for hosting side projects that need a static IP and root access.

**vs Heroku (Pack):** Heroku gives you push-to-deploy simplicity but zero SSH and no raw VM. DigitalOcean gives you the whole machine. Pick DO when you need custom Nginx configs, background workers, or GPU experimentation; pick Heroku when you just want `git push` and done.


---

## Heroku (Pack)

| Field | Value |
|-------|-------|
| URL | https://www.heroku.com |
| Cost | credits |
| Student | student required |
| Commercial | commercial ok |
| Limits | $13/mo × 24 months |

Simple PaaS credit for 24 months.

**Pick this if** you want the fastest path from `git push` to a live URL — no Dockerfiles, no infrastructure YAML, no SSH. The 24-month runway means your capstone demo stays online through graduation without babysitting.

**vs DigitalOcean (Pack):** DO gives you a whole VM to configure yourself. Heroku abstracts all of that away: add a Postgres add-on with one click, scale dynos with a slider. You trade control for speed — ideal when shipping matters more than learning ops.


---

## MongoDB Atlas Credits (Pack)

| Field | Value |
|-------|-------|
| URL | https://www.mongodb.com/cloud/atlas |
| Cost | credits |
| Student | student required |
| Commercial | commercial ok |
| Limits | $50 credits + free University cert path |

Stacks on top of free M0 forever tier.

**Pick this if** your app speaks MongoDB (Mongoose, Motor, or the native driver) and you want a managed cluster with backups, search indexes, and Charts without paying until $50 runs out. The free University cert is a résumé line that actually signals competence.

**vs Supabase/Neon free tiers:** Those are relational (Postgres). Atlas wins if your data is document-shaped (nested JSON, variable schemas). If you need joins and strict types, use a relational free tier instead.


---

## AWS Educate

| Field | Value |
|-------|-------|
| URL | https://aws.amazon.com/education/awseducate/ |
| Cost | credits |
| Student | student helps |
| Commercial | edu only |
| Limits | Lab credits vary by path |

Learning paths, badges, sandboxed labs.

**Pick this if** you want to learn AWS services (Lambda, S3, DynamoDB, EC2) hands-on in sandboxed labs without risking a surprise bill. The badges look good on LinkedIn and the labs teach real console workflows — but you can't deploy your own production app here.

**vs DigitalOcean/Heroku credits:** Those give you real hosting for real projects. AWS Educate is a classroom — you learn the AWS way, but you don't get a public URL you can put in a portfolio. Use Educate for learning, DO/Heroku for shipping.


---

## Namecheap .me (Pack)

| Field | Value |
|-------|-------|
| URL | https://www.namecheap.com |
| Cost | student free |
| Student | student required |
| Commercial | commercial ok |
| Limits | 1 yr .me + SSL · renew paid later |

Free domain year for a portfolio.

**Pick this if** you want `yourname.me` pointing at your portfolio site today — zero cost for 12 months with SSL included. A custom domain makes Vercel/Netlify/GitHub Pages deploys look professional instead of living on a `.vercel.app` subdomain.

**vs Cloudflare Registrar:** Cloudflare sells domains at cost with free DNS/proxy, but doesn't offer a free year. Namecheap's Pack deal gives you the first year free — grab it now, then transfer to Cloudflare at renewal if you want cheaper long-term pricing and built-in CDN.


---
