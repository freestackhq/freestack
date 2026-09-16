---
category: Weather
description: Weather forecast and current conditions APIs with free tiers
---

# Weather

## Comparison Matrix

| API | Auth | Free Tier | Rate Limit | CORS | Status |
|-----|------|-----------|------------|------|--------|
| [Open-Meteo](#open-meteo) | none | unlimited (non-commercial) | 10k req/day | ✓ | active |
| [OpenWeatherMap](#openweathermap) | api-key | 1000 calls/day | 60 req/min | ✓ | active |
| [WeatherAPI](#weatherapi) | api-key | 1M calls/mo | varies | ✓ | active |

---

## Open-Meteo

| Field | Value |
|-------|-------|
| Base URL | https://api.open-meteo.com/v1 |
| Docs | https://open-meteo.com/en/docs |
| Auth | none |
| Free Tier | unlimited requests for non-commercial use |
| Rate Limit | 10,000 req/day (non-commercial) |
| CORS | ✓ |
| Response | JSON |
| OpenAPI | ✓ |
| Status | active |

Open-source weather API with no API key required. Provides current weather, hourly/daily forecasts up to 16 days, historical data, and marine/air quality endpoints. Data sourced from national weather services (DWD, NOAA, MeteoFrance, etc.).

**Pick this if** you want weather data with zero signup, no key management, and generous limits for side projects.

**vs OpenWeatherMap** — Open-Meteo needs no key and has better free limits, but OpenWeatherMap has longer history and more integrations.

---

## OpenWeatherMap

| Field | Value |
|-------|-------|
| Base URL | https://api.openweathermap.org/data/2.5 |
| Docs | https://openweathermap.org/api |
| Auth | api-key |
| Free Tier | 1000 API calls/day, current + 5-day forecast |
| Rate Limit | 60 req/min |
| CORS | ✓ |
| Response | JSON, XML |
| OpenAPI | ✗ |
| Status | active |

The most widely-used weather API. Current conditions, 5-day/3-hour forecast, geocoding, and air pollution data on the free tier. One Call API 3.0 requires subscription but has a free tier of 1000 calls/day.

**Pick this if** you want the most ecosystem support (SDKs, tutorials, integrations everywhere) and don't mind managing an API key.

**vs Open-Meteo** — More integrations and wider data history, but requires signup and has stricter free limits.

---

## WeatherAPI

| Field | Value |
|-------|-------|
| Base URL | https://api.weatherapi.com/v1 |
| Docs | https://www.weatherapi.com/docs/ |
| Auth | api-key |
| Free Tier | 1M calls/month, current + 3-day forecast + astronomy |
| Rate Limit | varies by plan |
| CORS | ✓ |
| Response | JSON, XML |
| OpenAPI | ✓ |
| Status | active |

Weather data with current conditions, forecasts, historical data, and astronomy (sunrise/sunset). The free tier is generous at 1M calls/month but limited to 3-day forecasts.

**Pick this if** you need high volume on free tier and 3-day forecast is enough, or you want astronomy data included.

**vs Open-Meteo** — Higher free volume ceiling but requires a key; Open-Meteo is simpler for quick prototypes.
