# Equity Tracker

A personal stock watchlist application that applies Buffett-style (value investing) analysis to a ~68-stock candidate list, with automated daily monitoring, buy-zone detection, and email alerts.

**Live app:** [equity-tracker-pearl.vercel.app](https://equity-tracker-pearl.vercel.app)

> Status: actively in development. This ships the full watchlist app (Milestone 2). A portfolio-tracking and tax-mechanics layer is planned as a future, separate phase and is intentionally out of scope for now.

## What it does

- **Watchlist tracking** — maintains a list of candidate stocks with live prices, refreshed on a schedule
- **Buy-zone signals** — flags when a stock's price enters a pre-defined buy-zone range
- **AI-generated analysis** — runs a Buffett-style investment analysis per stock via the Anthropic API, with web search grounding for current information, and stores analysis history over time
- **Re-analysis queue** — automatically flags stocks that need a fresh look (stale analysis, buy-zone entry, or manual flag) and surfaces them in a dedicated queue view
- **Daily automation** — a scheduled job refreshes prices, detects buy-zone entries and stale analyses, and sends a daily email digest — no manual interaction required
- **Auth-gated** — the app requires login; it is not publicly accessible

## Architecture

The codebase keeps three layers strictly separate:

1. **Pure business logic** — plain TypeScript functions (e.g. buy-zone status, re-analysis flag computation) with no React or database calls, fully unit-testable in isolation
2. **Data layer** — Prisma ORM queries against Postgres (Supabase), nothing else lives here
3. **Presentation** — React Server/Client Components that render data; no business logic inside them

This separation paid off directly: a cron job was silently overwriting manually-set re-analysis flags with automated "stale" flags. The fix was extracting the flagging logic into a pure function (`computeReanalysisFlagUpdates`) that skips already-flagged stocks — and because it was pure, it was straightforward to unit test and verify the fix.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres) |
| ORM | Prisma 7 |
| Auth | Clerk |
| Hosting | Vercel (including Cron for scheduled jobs) |
| Email | Resend |
| AI analysis | Anthropic API (with web search tool) |
| Price data | Massive Market Data API |
| Testing | Vitest |
| CI | GitHub Actions (lint + test on every PR) |

## Environments

- `main` → production
- `staging` → a persistent branch with its own Supabase and Clerk instances, used to test AI calls and scheduled jobs before they touch production data

## Project structure

```
app/                      # Next.js App Router pages, layouts, Server Actions
components/               # React components (presentation only)
lib/                      # Pure business logic + Prisma client
prisma/                   # Schema and migrations
scripts/                  # Standalone utility/test scripts
.github/workflows/        # CI (lint + Vitest on PRs)
.claude/skills/           # Custom Claude Code skill for the Buffett analysis template
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables (Supabase connection strings, Clerk keys, Anthropic API key, Massive API key, Resend key) are required — see `.env.example` if present, or the relevant service dashboards.

## Roadmap

- Attach a custom domain (planned once the app reaches a stable post-hardening state)
- Timezone correction for trading-day calculation (align `getRecentTradingDate()` with the NYSE calendar via `America/New_York`)
- Portfolio tracking + tax mechanics (deferred, separate future project phase)
