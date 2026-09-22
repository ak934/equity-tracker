# Watchlist & Portfolio Refresh Protocol (reference)

Read this file only when the user issues a refresh trigger command. It is not needed for single-ticker analysis.


Trigger commands: "list", "refresh list", "update watchlist", "refresh portfolio", "update portfolio"

This protocol produces ONE HTML file with TWO tabs, because owned positions and tracked candidates do different jobs:

- **Portfolio tab** = names you actually own. Monitored for hold / add / trim / exit discipline. Carries cost-basis and account columns so you can see P&L and position sizing at a glance.
- **Watchlist tab** = names you track but do not own yet. Monitored for buy-zone entry.

**Routing rule (split by ownership, not by sleeve label):** if a ticker has a cost basis and account placement in memory, it belongs in Portfolio. Otherwise it belongs in Watchlist. This keeps routing unambiguous: a held 10x bet goes to Portfolio, an unowned 10x candidate goes to Watchlist. A ticker appears in exactly one tab, never both.

**Data prerequisite (do not fabricate).** Per-ticker Q/V scores, buy zones, SB lines, trim/exit rules, share counts, cost basis, and account are *user-maintained inputs*, not values to invent — this refresh only touches live prices, it does not re-run analysis. (Q/V scores get onto the record in the first place either because the user supplied them directly, or because a single-ticker analysis synced them via Step 4 above — this protocol just carries whatever's already on record forward and refreshes price against it.) The only field fetched fresh each run is the live price. If a value is not present in memory or supplied by the user, render that cell blank and note it; never manufacture a buy zone, score, or cost basis to fill a gap. When seeding the lists for the first time, ask the user to provide holdings (Portfolio) and tracked names with their zones (Watchlist), or work from a list they paste.

### Workflow
1. **Inventory both lists from memory.** Portfolio = all held positions. Watchlist = all active analysis entries plus unowned 10x candidates. Exclude DELIST-marked tickers. Confirm the count for each list separately (e.g., "Portfolio: 12 | Watchlist: 31").
2. **Batch-fetch live prices** via Massive Market Data API `/v3/snapshot` endpoint. Use `ticker.any_of` with up to 250 tickers per call. One fetch covers both lists; no need to split by tab. Split into 35-ticker chunks if URL length is an issue. Fetch BRK.B separately via `/v2/snapshot/locale/us/markets/stocks/tickers/BRK.B`.
   - **If the connector is unavailable or times out, do not stall.** Fall back to web search for each ticker's latest close, validate one bellwether against a second source, and label the price source plus timestamp in the artifact.
   - **Compute daily % change as (latest close minus prior close) / prior close.** Do not display the snapshot's raw session-change field when the market is closed: it reports the after-hours last-trade delta versus the prior close, not the full session move, and will read near-zero on a day the stock actually moved several percent.
3. **Reconcile each list against its own triggers.** Portfolio against trim / add / exit lines and any cost-basis-relative rules. Watchlist against buy zones, SB lines, and kill triggers. Identify breached triggers per list.
4. **Surface live triggers as a single numbered list** at the top of the response, but tag each with its list, e.g., "[PORTFOLIO] TRIM ..." or "[WATCH] SB breached ...". Honest framing: state the rule that fired, the action mandated, and the position size affected.
5. **Generate the two-tab HTML artifact** at `/mnt/user-data/outputs/` using the template below, including the storage layer described under Persistence. "Update in place" only applies to an artifact open in the *current* conversation. In a fresh session the file is gone: rebuild it, and let it repopulate from its own storage on load rather than asking the user to re-enter anything.
6. **Present file** via `present_files`. No long postamble.

### Persistence (required — build this first)

The container filesystem resets between conversations. The artifact's own key-value store does not, so the store is the record and the file is just a viewer for it.

Every build must include:

1. **Load on open.** Read the saved lists from storage before first paint, wrapped in try/catch, and show a loading state rather than a blank table. A missing key throws rather than returning null, so treat the error as "no data yet," not as a failure.
2. **Two keys, not two hundred.** Store as `bfa:portfolio` and `bfa:watchlist`, each holding the whole array. One row per key means dozens of calls and rate limiting. Use `shared: false`.
3. **Save on every mutation.** Any edit, import, or refresh writes the affected array straight back. Never let an update live in component state alone; that is the exact bug this section exists to close.
4. **An Import box.** A textarea plus an Import button that accepts the sync-record JSON from Step 4 of the main skill. Match on ticker, update only the fields present in the block (`q`, `v`, `action`, `note`, `analyzed`, and `list` for routing), and preserve every user-maintained field on that row. If the ticker is new, append it with the other fields blank. Show what changed after the import so a bad paste is visible immediately.
5. **An Export button.** Dumps both arrays as JSON so the user has a copy that does not depend on the store. Cheap insurance.
6. **User-maintained fields are never overwritten by a sync.** Buy zone, SB line, trim and exit rules, shares, cost basis, and account are input, not output. An import that would clear one is a bug.

### HTML Artifact Format (mandatory features)

The file opens with a **tab switcher** at the top: **Portfolio | Watchlist**. Default to the Portfolio tab on load. Each tab renders its own table. Sort and filter operate within the active tab only.

**Shared base columns** (both tabs, sortable, click headers to toggle ASC/DESC):
- Ticker, Q, V, Price, %Δ, Buy Zone, SB, vs Zone, Action, Role, Event Date, Event, Note

**Portfolio-only additional columns** (appended after the base set, all sortable):
- Shares
- Account (e.g., Rollover IRA, Taxable, Roth)
- Cost Basis (average per share)
- Market Value (Shares × Price)
- Unrealized P&L $ (Market Value minus Shares × Cost Basis)
- Unrealized P&L % (color-coded: muted green positive, muted red negative)
- Weight % of book (optional)

Because cost basis, account, and shares now have their own columns, do NOT also pack them into the Note field. Note is for qualitative remarks only.

**Filterable** (per active tab, AND logic):
- Action: All / SB / BUY / Staged / WAIT / HOLD / TRIM / EXIT / AVOID / 10x
- Event: All / Today / This Week / This Month / Later
- Role: All / CC / HQ / ST / 10x / AV
- Zone: All / In Zone / Below / Near / SB Active
- Account (Portfolio tab only): All / one entry per distinct account
- Search box (free-text ticker)
- Active filter shown with colored highlight; count display shows "N of M tickers" within the active tab

**Date-stamped events** in the "Event Date" column:
- Format: "May 14 TODAY" / "May 19 (6d)" / "May 28 (15d)" / "Jul 22 (past)"
- Color-coded by urgency:
  - **Today** = red background
  - **This week (≤7d)** = orange background
  - **This month (≤30d)** = yellow background
  - **Later (>30d)** = neutral gray
  - **Past** = muted text
- Sort by Event Date sorts by days-to-event (negative = past, 0 = today, positive = future)

**Live trigger insight box** at top, spanning BOTH lists:
- Red-left-border callout listing every fired trigger across portfolio and watchlist, each prefixed with its list (e.g., "[PORTFOLIO] EXIT due", "[WATCH] SB breached")
- Calendar preview: "This week" list of dated catalysts, drawn from both lists

**Zone color-coding** on row backgrounds:
- `in-zone` green = price inside buy zone
- `below` darker green = price below low (better entry)
- `near` yellow = within 5% of zone top
- `sb-active` highlighted green + bold = SB threshold breached
- `above-zone` no background

**Action label colors** (eye-friendly palette per eye-friendly-colors skill):
- SB = solid green
- BUY/BUY-h = light green
- STG = blue
- WAIT = gray
- HOLD = yellow
- TRIM/REDUCE = orange
- EXIT = red
- AVOID = light red
- 10x = purple

**Style** (per eye-friendly-colors skill):
- Background `#F5F0EB` (warm off-white, never pure white)
- Surface `#EDEAE5` / `#E4E0DA` for cards and table headers
- Text `#2C2C2C` (never pure black)
- All accents muted/desaturated
- Reduced contrast ~6:1
- Sticky table headers
- Hover states subtle

### Implementation Notes
- Build TWO JSON arrays in `<script>`: `portfolioData` and `watchlistData`. Render the active tab's array client-side for instant filter/sort response.
- Tab switching toggles which array feeds the render function, then re-applies that tab's active sort and filter state.
- Precompute portfolio derived fields in Python before embedding (`market_value`, `upl_dollar`, `upl_pct`, and `weight` if used), so the JS only displays them.
- Compute `days_to_event` and `evt_cat` server-side (Python) for filter accuracy
- `vs_zone` calculation: parse buy zone numbers from string, compare to current price, return (class, status_string)
- Symbol modifiers preserved: `*` = PM-override, `m` = macro-adjusted, `a` = AI-disruption-adjusted, `r` = raw V
- Held-position details (account, shares, cost basis) live in dedicated Portfolio columns, NOT the Note field
- Filename pattern: `<date>_watchlist_portfolio.html`
- Within a single conversation, skip the rebuild if the open artifact has the same structure — just update both JSON data arrays via str_replace. Across conversations there is nothing to skip; rebuild and let storage refill it.

### What NOT to include
- No long preamble before the artifact
- No "let me explain what I'm doing" narration
- No bullet-list of all 105 tickers in chat (that's what the file is for)
- No re-asking about scope — default to FULL list; only ask if user explicitly wants subset
- No duplicating a held name into the Watchlist tab — ownership routing is exclusive, one tab per ticker
