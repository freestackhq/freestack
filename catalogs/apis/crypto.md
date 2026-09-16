---
category: Crypto
description: Cryptocurrency price, market, and blockchain data APIs
---

# Crypto

## Comparison Matrix

| API | Auth | Free Tier | Rate Limit | CORS | Status |
|-----|------|-----------|------------|------|--------|
| [CoinGecko](#coingecko) | none (demo key optional) | unlimited endpoints | 10-30 req/min | ✓ | active |
| [CoinCap](#coincap) | none (key optional) | all endpoints free | 200 req/min (key) | ✓ | active |
| [CryptoCompare](#cryptocompare) | api-key | 100k calls/mo | varies | ✓ | active |

---

## CoinGecko

| Field | Value |
|-------|-------|
| Base URL | https://api.coingecko.com/api/v3 |
| Docs | https://www.coingecko.com/api/documentation |
| Auth | none (demo key for higher limits) |
| Free Tier | all endpoints, no key required |
| Rate Limit | 10-30 req/min (varies by endpoint) |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✓ |
| Status | active |

The most popular free crypto data API. Prices, market cap, volume, historical data, trending coins, exchange info, and NFT data. No signup required for basic use; a free demo key raises rate limits slightly.

**Pick this if** you want the broadest crypto data coverage with zero signup friction.

**vs CoinCap** — CoinGecko has more data (NFTs, exchanges, categories) but lower free rate limits. CoinCap is simpler and faster for price tickers.

---

## CoinCap

| Field | Value |
|-------|-------|
| Base URL | https://rest.coincap.io/v3 |
| Docs | https://docs.coincap.io |
| Auth | none (API key optional for higher limits) |
| Free Tier | all endpoints free |
| Rate Limit | 200 req/min with key, lower without |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Real-time crypto prices, market data, and exchange rates. Also provides WebSocket streams for live price updates. Simple, fast, and focused on price/market data rather than trying to cover everything.

**Pick this if** you need fast real-time price data with WebSocket support and don't need NFT/exchange metadata.

**vs CoinGecko** — Simpler API surface, higher rate limits, but less breadth (no NFTs, fewer historical endpoints).

---

## CryptoCompare

| Field | Value |
|-------|-------|
| Base URL | https://min-api.cryptocompare.com |
| Docs | https://min-api.cryptocompare.com/documentation |
| Auth | api-key |
| Free Tier | 100,000 calls/month |
| Rate Limit | varies by endpoint |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✗ |
| Status | active |

Comprehensive crypto data including OHLCV, social stats, mining data, and exchange volumes. Strong historical data going back years. The free tier is generous for prototyping.

**Pick this if** you need OHLCV/candlestick data for charting, social sentiment metrics, or deep historical data.

**vs CoinGecko** — Better for trading/charting use cases with proper OHLCV; CoinGecko is better for general market overview.
