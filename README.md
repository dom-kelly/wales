# Wales 2026 — Family Trip Itinerary

A static React site for the family campervan trip, 1–9 August 2026. Hosted on Cloudflare Pages with checkbox state synced across devices via Cloudflare KV.

## Stack

- **Vite + React** — fast dev + simple build
- **Tailwind CSS** — for styling, with custom design tokens in `src/index.css`
- **lucide-react** — icons
- **Cloudflare Pages** — hosting + auto-deploy on `git push`
- **Cloudflare Pages Functions** — `/api/state` endpoint for shared state
- **Cloudflare KV** — persistent storage for booking + packing checkboxes

## Local development

```bash
npm install
npm run dev          # starts vite on localhost:5173
```

Checkbox state won't sync in dev (no KV in the vite dev server) — it falls back to localStorage. To test the full setup with the Pages Function locally:

```bash
npx wrangler pages dev -- npm run dev
```

That spins up a local Cloudflare-style runtime that handles `/api/state` against a local KV.

## Deploying to Cloudflare Pages

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
gh repo create wales-trip-2026 --private --source=. --push
# (or create the repo manually and push)
```

### 2. Create the Pages project
- Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
- Pick your `wales-trip-2026` repo
- Framework preset: **Vite**
- Build command: `npm run build`
- Build output directory: `dist`
- Save and deploy. First build takes ~2 minutes.

### 3. Create a KV namespace for shared state
- Dashboard → **Workers & Pages** → **KV** → **Create a namespace** → name it `wales-trip-state`
- Note the namespace ID

### 4. Bind KV to the Pages project
- Pages → your project → **Settings** → **Functions** → **KV namespace bindings**
- Variable name: `TRIP_STATE`
- KV namespace: pick `wales-trip-state`
- Save, then trigger a redeploy (push any commit or click "Retry deployment")

### 5. Custom domain
- Pages → your project → **Custom domains** → **Set up a custom domain**
- Enter e.g. `wales.voodoodigital.co.uk`
- Cloudflare auto-configures DNS if the parent domain is on Cloudflare; otherwise add a CNAME at your registrar

## Editing content with Claude Code

```bash
git clone git@github.com:YOUR-USER/wales-trip-2026.git
cd wales-trip-2026
claude
```

Then in Claude Code, you can ask things like:
- "Change Day 4 lunch to fish and chips at Barmouth"
- "Add a new packing list item for Mason's swimming costume"
- "The Royal Oak Inn phone number is wrong, it should be XXX"

Claude Code edits `src/App.jsx` directly, then you commit and push:

```bash
git add . && git commit -m "Update Day 4 lunch" && git push
```

Cloudflare picks up the push, rebuilds, deploys in ~60s.

## File structure

```
.
├── functions/api/state.js  → Cloudflare Pages Function (read/write KV)
├── src/
│   ├── App.jsx             → main React component (all trip data + UI)
│   ├── api.js              → useSharedState hook for KV-backed state
│   ├── index.css           → Tailwind + design tokens
│   └── main.jsx            → React entry point
├── index.html              → HTML shell + Fraunces font load
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Known gaps to iterate on later

- Single file `App.jsx` with all data inline — could split into `data/` modules
- No auth on the API — anyone with the URL can edit checkboxes (fine for family sharing)
- No undo on checkbox toggles
- Map is a static SVG — could be interactive with Leaflet/MapLibre

## Design tokens

Defined as CSS variables in `src/index.css`:

| Variable | Hex | Use |
|---|---|---|
| `--cream` | `#f5efe0` | Page background |
| `--paper` | `#faf6ec` | Card background |
| `--stone` | `#e8e0cc` | Subtle surface |
| `--ink` | `#1f2d27` | Primary text |
| `--slate` | `#6b746f` | Secondary text |
| `--green` | `#3a5c47` | Sight stops, success |
| `--rust` | `#b9542f` | Food stops, urgent |
| `--accent` | `#7a5b3e` | Activities, links |
