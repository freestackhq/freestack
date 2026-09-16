---
category: Search & data
description: Search, vector search, and data pipelines.
order: 9
---

# Search & data

## Comparison Matrix

| Service | Cost | Student | Commercial | Limits |
|---------|------|---------|------------|--------|
| [Typesense Cloud](#typesense-cloud) | free forever | anyone | commercial ok | Free/hobby cluster sizes · or self-host OSS free |
| [Meilisearch Cloud](#meilisearch-cloud) | free forever | anyone | commercial ok | Cloud free tier · self-host OSS unlimited |
| [Algolia DocSearch](#algolia-docsearch) | free forever | anyone | check ToS | Free for qualifying open-source docs · paid for product search |
| [ClickHouse Cloud](#clickhouse-cloud) | free forever | anyone | commercial ok | Development free tier · then usage |
| [DuckDB](#duckdb) | free forever | anyone | commercial ok | OSS · runs in-process · MotherDuck for cloud |
| [Sequin](#sequin) | free forever | anyone | commercial ok | OSS + cloud free tiers · check current caps |
| [Parquet + Arrow](#parquet-arrow) | free forever | anyone | commercial ok | Open formats · storage = your disk/R2 bill |

---

## Typesense Cloud

| Field | Value |
|-------|-------|
| URL | https://typesense.org |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Free/hobby cluster sizes · or self-host OSS free |
| Tags | search |
| Verified | 2026-07-24 |

Typo-tolerant search without standing up Elasticsearch.

**Pick this if** you need typo-tolerant, sub-50ms instant search and you want one binary you can self-host today or move to their managed cloud later — no JVM, no cluster ops, no Elasticsearch YAML nightmares.

**vs Meilisearch:** Typesense edges out on geo-search, multi-tenant API-key scoping, and HA clustering out of the box; Meilisearch wins on simplicity and first-10-minutes DX. **vs Algolia:** Typesense gives you the same "search-as-you-type" UX without per-query pricing that explodes at scale.


---

## Meilisearch Cloud

| Field | Value |
|-------|-------|
| URL | https://www.meilisearch.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Cloud free tier · self-host OSS unlimited |
| Tags | search |
| Verified | 2026-07-24 |

Fast product/docs search — generous free docs + cloud starter.

**Pick this if** you're building a product catalog or docs site and want the fastest path from zero to working search — the dashboard, SDKs, and default relevance just work, and the free cloud tier is generous enough for most indie projects.

**vs Typesense:** Meilisearch has a friendlier getting-started experience and better default relevance out of the box; Typesense is stronger once you need custom ranking formulas or multi-node HA. **vs Algolia:** Meilisearch is OSS and self-hostable with no per-search pricing — you outgrow Algolia's free tier fast, you never outgrow a self-hosted Meilisearch.


---

## Algolia DocSearch

| Field | Value |
|-------|-------|
| URL | https://docsearch.algolia.com |
| Cost | free forever |
| Student | anyone |
| Commercial | check ToS |
| Limits | Free for qualifying open-source docs · paid for product search |
| Tags | search, docs |
| Verified | 2026-07-24 |

Free search for open-source documentation sites (DocSearch program).

**Pick this if** you maintain open-source documentation and want a polished, zero-config search modal that Algolia crawls, indexes, and hosts for free — you literally apply, get accepted, paste a snippet.

**vs Meilisearch/Typesense:** DocSearch is zero-ops (Algolia runs everything), but you give up control — you can't customize ranking, and it only works for public docs. **vs self-hosted search:** If your docs are open-source and public, DocSearch saves you running infrastructure entirely; the moment you need search in a private app or product, switch to Typesense/Meilisearch.


---

## ClickHouse Cloud

| Field | Value |
|-------|-------|
| URL | https://clickhouse.com/cloud |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Development free tier · then usage |
| Tags | analytics |
| Verified | 2026-07-24 |

Analytics warehouse without babysitting shards — free tier for experiments.

**Pick this if** you have event/log/time-series data that outgrows Postgres and you want sub-second aggregations over billions of rows without managing Spark clusters or paying Snowflake prices.

**vs DuckDB:** ClickHouse is for always-on, multi-user analytics dashboards; DuckDB is for single-user, ad-hoc laptop queries. Choose ClickHouse when your app serves live charts to users. **vs BigQuery/Snowflake:** ClickHouse's free dev tier and usage pricing make it practical for indie projects; the big warehouses price you out before you have revenue.


---

## DuckDB

| Field | Value |
|-------|-------|
| URL | https://duckdb.org |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS · runs in-process · MotherDuck for cloud |
| Tags | analytics, oss |
| Verified | 2026-07-24 |

$0 local warehouse — Parquet/CSV analytics on a laptop before MotherDuck.

**Pick this if** you want to run analytical SQL on local Parquet/CSV files without any server, any cost, or any setup — just `pip install duckdb` or grab the CLI and query terabytes on your laptop.

**vs ClickHouse:** DuckDB is embedded and ephemeral (think SQLite for analytics); ClickHouse is a running server for concurrent users and live dashboards. Use DuckDB in scripts and notebooks, ClickHouse in production. **vs Pandas:** DuckDB handles datasets that blow out Pandas memory, runs standard SQL, and reads Parquet natively — it replaces most "load into DataFrame → groupby" workflows.


---

## Sequin

| Field | Value |
|-------|-------|
| URL | https://sequinstream.com |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | OSS + cloud free tiers · check current caps |
| Tags | cdc, postgres |
| Verified | 2026-07-24 |

Postgres change streams / sync when “just poll the DB” stops scaling.

**Pick this if** you need real-time change-data-capture from Postgres without bolting on Kafka + Debezium — Sequin gives you ordered, exactly-once streams from your existing tables with one connection string.

**vs Debezium/Kafka:** Sequin is dramatically simpler to operate (no Zookeeper, no Connect cluster) and purpose-built for Postgres; Debezium is the choice only if you also need MySQL/Mongo CDC or already run Kafka. **vs LISTEN/NOTIFY:** Postgres NOTIFY drops messages under load and has a payload size limit; Sequin gives you durable, replayable streams with backpressure.


---

## Parquet + Arrow

| Field | Value |
|-------|-------|
| URL | https://parquet.apache.org |
| Cost | free forever |
| Student | anyone |
| Commercial | commercial ok |
| Limits | Open formats · storage = your disk/R2 bill |
| Tags | datalake, oss |
| Verified | 2026-07-24 |

Columnar files as your cheap datalake — pair with DuckDB, skip Snowflake early.

**Pick this if** you want a zero-cost, future-proof datalake format — dump events/logs as Parquet to R2 or local disk, query with DuckDB now, and swap in ClickHouse or Snowflake later without reformatting anything.

**vs CSV/JSON:** Parquet is columnar and compressed — 10× smaller files, 100× faster analytical queries, and schema-aware so you catch type bugs at write time. **vs a managed warehouse:** Parquet + DuckDB gives you the same query power at $0 until your data or concurrency demands a running server; it's the cheapest possible starting point for analytics.


---
