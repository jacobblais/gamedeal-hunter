# GameDeal Hunter 🎮

**Find the best gaming laptop deals in Canada — automatically.**

GameDeal Hunter continuously monitors Canadian retailers, scores deals based on real gaming performance, tracks price history, and notifies you when something genuinely good appears.

> **Status:** Phase 1 complete — full UI with sample data running locally. Connect Supabase to enable real data. See setup instructions below.

---

## What it does

- **Tracks prices** across Best Buy Canada, Canada Computers, Memory Express, Newegg, Dell, Lenovo, HP, and Amazon.ca
- **Estimates gaming FPS** for Crimson Desert, Black Myth: Wukong, Spider-Man 2, Cyberpunk 2077, and more — with GPU TGP adjustments
- **Scores deals 0–100** based on performance/price, VRAM, RAM, display quality, price history, and seller reliability
- **Alerts you via Discord and email** when a qualifying deal appears, with configurable rules per search profile
- **Tracks price history** over time — distinguishes real drops from fake discounts
- **Fully configurable through the UI** — GPU filters, game requirements, scoring weights, saved search profiles — no code changes needed

---

## Quick Start (macOS / M1)

### Prerequisites

- Node.js 22+ (`node --version`)
- Python 3.13+ (`python3 --version`)
- A free [Supabase](https://supabase.com) account (for database)

### 1. Clone and install

```bash
cd /path/to/gamedeal-hunter
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — for notifications
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RESEND_API_KEY=re_xxxx
NOTIFICATION_EMAIL_FROM=deals@yourdomain.com
NOTIFICATION_EMAIL_TO=you@yourdomain.com

# For the manual scan trigger endpoint
WORKER_API_KEY=change-me-to-a-random-secret
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create Project
2. Open **SQL Editor**
3. Run `supabase/migrations/001_initial_schema.sql` (full schema)
4. Optionally run `supabase/migrations/002_sample_data.sql` for development data
5. Copy your **URL** and **API keys** from Settings → API into `.env.local`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Without Supabase:** The dashboard shows clearly labeled sample data so you can explore the full UI immediately.

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Best deals right now, stats, filters |
| Compare | `/compare` | Side-by-side laptop comparison |
| Search Config | `/search-config` | Saved search profiles with GPU, game, and scoring config |
| All Deals | `/deals` | Full listing table (requires Supabase) |
| Favorites | `/favorites` | Saved favorite listings |
| Price Alerts | `/alerts` | Discord/email alert configuration |
| Settings | `/settings` | Supabase, notifications, retailer status |

---

## Python Worker

The background worker runs on a schedule (GitHub Actions) and:

1. Fetches listings from enabled retailer connectors
2. Normalizes specs (GPU, RAM, storage, display)
3. Scores each deal
4. Saves price observations to Supabase
5. Sends Discord/email notifications for qualifying deals

### Run locally

```bash
cd worker
pip install -r requirements.txt

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

python main.py
```

### Tests

```bash
python -m pytest tests/ -v
```

---

## Deploy to Vercel

```bash
npx vercel --prod
```

Set the same environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

---

## Deploy worker to GitHub Actions

1. Push this repository to GitHub
2. Go to **Settings → Secrets and variables → Actions**
3. Add all secrets from `.env.example`
4. The `.github/workflows/scan.yml` workflow runs automatically every 60 minutes
5. You can also trigger it manually from **Actions → GameDeal Hunter — Scan Retailers → Run workflow**

---

## Retailer Status

| Retailer | Status | Data Source | Notes |
|----------|--------|-------------|-------|
| Canada Computers | ✅ Ready | Static HTML | Parses product cards |
| Memory Express | 🔧 Stub | Static HTML | Needs HTML parser implementation |
| Best Buy Canada | ⚠️ JS required | Affiliate API | Needs affiliate enrollment or Playwright approval |
| Lenovo Canada | 🔧 Stub | Static HTML | Needs implementation |
| Dell Canada | 🔧 Stub | Static HTML | Needs implementation |
| HP Canada | 🔧 Stub | Static HTML | Needs implementation |
| Newegg Canada | 🔧 Stub | Static HTML | Needs implementation |
| Amazon.ca | ⚠️ API required | PA-API only | Requires Amazon affiliate enrollment |

**Adding a new retailer:** Create a class in `worker/connectors/` inheriting from `BaseConnector`. Register it in `worker/main.py`.

---

## Discord Notifications

Set `DISCORD_WEBHOOK_URL` in `.env.local` and enable Discord in Search Config → Notification Rules.

Example notification:

```
🔥 Gaming Laptop Deal — 82/100

Lenovo Legion 5i Pro — RTX 5070 Ti (32GB, 1TB)
💰 Price: C$2,249.99 (Canada Computers)
📉 Down from $2,499 (saved $250, 10% off)
GPU: RTX 5070 Ti (150W TGP) | VRAM: 12GB | RAM: 32GB

View Deal → [link]
```

---

## Deal Scoring

Each laptop is scored 0–100 using weighted factors (all configurable in Search Config):

| Factor | Default Weight | Description |
|--------|---------------|-------------|
| Gaming Performance | 30% | GPU tier × TGP adjustment |
| Price / Value | 25% | Price relative to performance tier |
| Price History | 15% | Current vs. historical prices |
| VRAM | 10% | GPU memory capacity |
| RAM & Storage | 8% | System memory and SSD |
| Display Quality | 5% | Resolution, refresh rate, panel |
| Seller Reliability | 4% | Retailer trust + spec confidence |
| Condition | 2% | New vs. open-box vs. refurbished |
| Shipping | 1% | Free shipping preferred |

**Important:** GPU TGP (power limit) affects performance estimates. An RTX 5070 at 65W performs significantly below one at 115W.

---

## FPS Estimates

Performance estimates are based on GPU tier and TGP, adjusted for known laptop implementations. They are **estimates only** — actual FPS depends on:
- Game version and patches
- Specific laptop thermals and cooling
- Driver version
- Graphics settings
- DLSS/FSR quality mode

All estimates are clearly labeled. Where measured benchmarks exist in the database, they are used instead.

---

## Project Structure

```
gamedeal-hunter/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── compare/            # Comparison page
│   │   ├── search-config/      # Search profile editor
│   │   ├── settings/           # Settings page
│   │   ├── alerts/             # Notification history
│   │   └── favorites/          # Saved favorites
│   ├── components/
│   │   ├── deals/              # DealCard, FilterSidebar
│   │   └── layout/             # Sidebar, TopBar
│   ├── lib/
│   │   ├── supabase/           # client.ts, server.ts
│   │   ├── scoring/            # Deal scoring algorithm
│   │   ├── benchmarks/         # Game/GPU FPS estimates
│   │   └── utils/              # Formatting, colors
│   └── types/                  # TypeScript types
├── worker/
│   ├── main.py                 # Worker entry point
│   ├── normalizer.py           # Spec parsing/normalization
│   ├── scorer.py               # Deal scoring (Python)
│   ├── notifier.py             # Discord & email
│   ├── requirements.txt
│   └── connectors/
│       ├── base.py             # Abstract base connector
│       ├── best_buy_ca.py      # Best Buy Canada
│       ├── canada_computers.py # Canada Computers
│       └── memory_express.py   # Memory Express (stub)
├── supabase/migrations/
│   ├── 001_initial_schema.sql  # Full DB schema
│   └── 002_sample_data.sql     # Dev sample data
├── tests/
│   └── test_worker.py          # Automated tests
├── .github/workflows/
│   └── scan.yml                # GitHub Actions cron job
├── .env.example
└── README.md
```

---

## Ethical Data Collection

This application only accesses publicly available product information. It:

- ✅ Respects `robots.txt` for all retailers
- ✅ Uses minimum 3-second delays between requests
- ✅ Identifies itself with a descriptive User-Agent
- ✅ Prefers official APIs and affiliate feeds over scraping
- ✅ Never bypasses CAPTCHAs, authentication, or anti-bot systems
- ✅ Never fabricates prices, availability, or specifications
- ✅ Marks all FPS estimates clearly as estimates
- ❌ Does not bombard retailers with high-frequency requests

If a retailer contacts you requesting removal, disable their connector in the database (`is_enabled = false` in `retailer_connectors`).

---

## Troubleshooting

**App shows "DB not connected" in the header:**
→ Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Restart `npm run dev`.

**No listings appear after connecting Supabase:**
→ Run the migration SQL in Supabase SQL Editor. Optionally run `002_sample_data.sql`.

**Worker fails with "SUPABASE_URL not set":**
→ Export the environment variables before running `python main.py`, or use a `.env` file with `python-dotenv`.

**Canada Computers shows "No product cards found":**
→ The website's HTML structure may have changed. Open the page in a browser, inspect the product card element, and update the CSS selector in `worker/connectors/canada_computers.py`.

**Discord notifications not sending:**
→ Verify `DISCORD_WEBHOOK_URL` is set correctly. Test it with `curl -X POST $DISCORD_WEBHOOK_URL -H "Content-Type: application/json" -d '{"content":"test"}'`.

---

## License

MIT. Data belongs to the respective retailers. This tool is for personal price monitoring only.
