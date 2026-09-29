# SubShield

SubShield is a team software subscription and seat cost tracker for small and mid-size businesses. It shows monthly spend, unused paid seats, and upcoming renewals in one place.

## What it helps you catch

- Surprise renewals on tools such as Slack, Figma, Zoom, Adobe, and Workspace
- Paid seats still billed after someone leaves the company
- The true monthly and yearly software bill across teams

## Dual hosting

- **Vercel** serves the app and the live data service together.
- **GitHub Pages** serves the visual app. Point `VITE_API_URL` at your Vercel site so Pages can still load live numbers.

## Setup

1. Create a free [Turso](https://turso.tech) database (or skip this locally — the app falls back to a file database).
2. Copy `.env.example` to `.env` and fill in:

```
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
VITE_API_URL=
```

Leave `VITE_API_URL` empty on Vercel so the app calls `/api` on the same site.

On GitHub Pages, set repository variable `VITE_API_URL` to `https://your-app.vercel.app` (no trailing slash).

3. Install and run locally:

```
npm install
cd client && npm install && cd ..
npm run dev
```

The data service starts on port 3001. The app starts on port 5173.

## Vercel

1. Import this repository in Vercel.
2. Add environment variables `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. Deploy. First launch creates tables and sample data (Slack, Figma, Google Workspace plus four team members).

## GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds `client` and publishes the `gh-pages` branch.

Enable Pages: Settings → Pages → Deploy from branch → `gh-pages` / root.

## Tabs

- Dashboard — monthly burn, yearly spend, wasted seats, renewals this week
- Software List — every tool, seats bought vs used, monthly cost
- Seat Audit — assign seats, mark unused seats, log departed staff
- Renewal Calendar — upcoming charge dates and a cancel-before-renewal flag
- Cost Insights — spend share by category and company name / currency

## Data service routes

- `GET /api/overview`
- `GET|POST /api/subscriptions` and `PUT|DELETE /api/subscriptions/:id`
- `GET|POST /api/employees` and `PATCH /api/employees/:id/status`
- `GET /api/seats`, `POST /api/seats/assign`, `PATCH /api/seats/:id/toggle`
- `GET /api/renewals`
- `GET|PUT /api/settings`
- `GET /api/insights`
