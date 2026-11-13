# Imported awesome lists

Decision #3 in `ARCHITECTURE.md`: check every candidate list, and import only the ones whose license allows reuse. Imported entries fill the Unlabeled bin. They have no numbers until someone writes their label.

- Script: `pnpm import:lists` (`scripts/import-lists.mjs`). It fetches each list at a pinned commit and writes `data/imported/<list-id>.yaml`.
- To move to newer commits, run `pnpm import:lists --latest`, then copy the printed SHAs into `LISTS` in the script.
- Licenses were read from each repo's LICENSE file on 2026-11-13, not from badges or hearsay. Entry counts are rough.

## License review

| List | License (SPDX) | Reuse in an MIT site with credit? | Conditions | Last commit | Entries | Fits our aisles | Verdict |
|---|---|---|---|---|---|---|---|
| [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev) | none (no LICENSE file, no notice in README) | No. All rights reserved. | n/a | 2026-11-13 | ~1,440 | Strong | **Skip.** No license. Ask the maintainer to add one, then import. |
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | MIT | Yes | Keep the copyright and permission notice | 2026-11-11 | ~2,400 | Weak (auth, email, storage, LLM sections only) | **Import** as `public-apis` |
| [marcelscruz/public-apis](https://github.com/marcelscruz/public-apis) | MIT | Yes | Keep the copyright and permission notice | 2026-11-13 | ~2,050 | Weak (same sections) | **Import** as `public-apis-community`, deduped against `public-apis` |
| cheahjs/free-llm-api-resources | unknown | No | n/a | gone | n/a | Strong | **Skip.** Repo returns 404 on GitHub and the API as of 2026-11-13. |
| [mnfst/awesome-free-llm-apis](https://github.com/mnfst/awesome-free-llm-apis) | CC0-1.0 | Yes | None. We credit it anyway. | 2026-11-11 | ~14 providers | Strong (Inference) | **Import** as `awesome-free-llm-apis` |
| [open-free-llm-api/awesome-freellm-apis](https://github.com/open-free-llm-api/awesome-freellm-apis) | MIT | Yes | Keep the copyright and permission notice | 2026-11-12 | ~32 providers | Strong (Inference) | **Import** as `awesome-freellm-apis` |
| [amardeeplakshkar/awesome-free-llm-apis](https://github.com/amardeeplakshkar/awesome-free-llm-apis) | CC0-1.0 | Yes | None. We credit it anyway. | 2026-10-01 | ~19 providers | Strong (Inference) | **Import** as `awesome-free-llm-apis-amar`. Mostly overlaps the two lists above; dedupe keeps the new ones. |
| [awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) and [-data](https://github.com/awesome-selfhosted/awesome-selfhosted-data) | CC-BY-SA-3.0 | Yes, if the imported file stays CC BY-SA 3.0 with credit | Attribution, share-alike | 2026-11-10 | ~1,275 | Poor | **Skip for fit.** It lists software you run yourself, not hosted free tiers. Compliance would be easy: keep the file under CC BY-SA 3.0 with the header below, separate from the MIT code. |
| [255kb/stack-on-a-budget](https://github.com/255kb/stack-on-a-budget) | MIT | Yes | Keep the copyright and permission notice | 2026-11-11 | ~215 | Strong (databases, hosting, servers, auth, email, queues) | **Import** as `stack-on-a-budget` |
| [wdhdev/free-for-life](https://github.com/wdhdev/free-for-life) | MIT | Yes | Keep the copyright and permission notice | 2026-11-04 | ~440 | Medium | **Import** as `free-for-life` |
| education/GitHub-Student-Developer-Pack | n/a | n/a | n/a | n/a | n/a | Strong (Student) | **Skip.** No public machine-readable listing. The pack's page is not a licensed dataset. |
| [github-education-resources/Student-Developer-Pack-Current-Partners-FAQ](https://github.com/github-education-resources/Student-Developer-Pack-Current-Partners-FAQ) | none | No | n/a | 2026-11-05 | FAQ, not a list | Weak | **Skip.** No license. |
| [AchoArnold/discount-for-student-dev](https://github.com/AchoArnold/discount-for-student-dev) | none | No | n/a | 2026-11-07 | ~170 | Strong (Student) | **Skip.** No license. |
| [OshekharO/Free-For-Student](https://github.com/OshekharO/Free-For-Student) | GPL-3.0 | Only if the data file is GPL-3.0 | Copyleft, source notice | 2026-10-01 | ~100 | Medium | **Skip.** Small, and its entries overlap the student programs we already curate. |
| [piyushmaurya23/free-for-student](https://github.com/piyushmaurya23/free-for-student) | MIT | Yes | Notice | 2018-07-29 | small | Medium | **Skip.** Not updated since 2018. |
| [johnjago/awesome-free-software](https://github.com/johnjago/awesome-free-software) | CC0-1.0 | Yes | None | 2025-04-29 | ~165 | None | **Skip.** Desktop free software, no aisle fits. |
| [mezod/awesome-indie](https://github.com/mezod/awesome-indie) | CC-BY-SA-3.0 | Yes, with share-alike | Attribution, share-alike | 2024-06-12 | small | None | **Skip.** Indie-maker reading, not tools. |

## What we import

- Only entries in a section mapped to an aisle that exists in `data/aisles.yaml`. The mapping is the rules table in `scripts/import-lists.mjs`. A rule can also require (`match`) or reject (`skip`) words in the entry's description, so mixed sections (Email has temp-mail and validators) only yield real fits.
- Only structured fields: `id`, `name`, `url`, `aisle`. Descriptions are read to classify, then dropped. Names are cut to letters, digits and light punctuation (max 60 chars), and URLs must be `http(s)`. This keeps free text away from the MCP server.
- Deduped against the curated catalog (`catalogs/**/*.md` and `data/tools/*.yaml`) and against lists earlier in `LISTS`. Two entries are the same when the normalized names match ("Supabase Postgres" = "Supabase") or the domains match. Big vendors (Google, AWS, Cloudflare and others) are matched per product, not per domain.
- Links to a pricing page or an API-key console are pointed at the product: a console goes to the vendor's root domain, a pricing page to its site root (for shared vendors like `aws.amazon.com/cognito/pricing/`, the page above it).
- Dead vendors are kept out by `data/imported/denylist.yaml` (`id`, `url`, `reason`, `date`), matched on the id slug or the exact listed URL. Add a line when the weekly link check and a look at the page show the vendor is gone.
- Ids are `a-z0-9-` slugs, unique across all imported files and never the same as a catalog tool id.
- New aisles (search, observability, open data...) land in another lane. Add rules for them to `LISTS` once they exist in `data/aisles.yaml`. Rules for missing aisles are ignored.

## Attribution

- **In the data.** Every `data/imported/<list-id>.yaml` starts with a comment naming the source repo, the pinned commit and the license. For MIT lists the full license text with its copyright line is copied in, as MIT requires. For CC0 lists the header names the license and links its text. The `list` block repeats `url`, `license`, `license_url` (the LICENSE file at the pinned commit) and `commit`.
- **On the site.** An imported entry's label shows the list it came from ("From free-for-life. No numbers yet"), linked to `list.url` (see `docs/SCREENS.md`, "From an awesome list"). The tool page and the API carry `list.name`, `list.url` and `list.license`.
- **Share-alike lists, if one is ever imported.** The YAML file keeps the list's license (for example CC BY-SA 3.0), not MIT. The header and the `list` block say so, and the site credits the list and links the license next to each entry. Only that file is under share-alike; the MIT code that reads it is not.
- **Lists without a license** are never imported, however useful. Ask the maintainer to add one first.
