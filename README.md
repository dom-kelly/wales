# Wales 2026 — Family Trip Itinerary

A static React site for the family campervan trip, 1–9 August 2026. Hosted on Cloudflare Pages with checkbox state synced across devices via Cloudflare KV.

## Stack

- **Vite + React** — fast dev + simple build
- **Tailwind CSS** — for styling, with custom design tokens in `src/index.css`
- **lucide-react** — icons
- **Cloudflare Pages** — hosting + auto-deploy on `git push`
- **Cloudflare Pages Functions** — `/api/state` and `/api/photos` endpoints
- **Cloudflare KV** — booking + packing checkboxes, and the photo metadata index
- **Cloudflare R2** — the photo files themselves

## Routes

Each tab is a real URL, so refreshing keeps you where you were, the back button works, and you can send someone a direct link:

| Path | Tab |
|---|---|
| `/` | Route (also `/route`) |
| `/bookings` | Bookings |
| `/todo` | To do |
| `/photos` | Photos |

Anything unrecognised falls back to the Route tab. There's no router library — it's `history.pushState` plus a `popstate` listener in `useTabRoute`.

Because those paths have no file on disk, `public/_redirects` rewrites everything to `index.html` so a hard refresh on `/photos` doesn't 404. Pages Functions are matched before that rewrite, so `/api/*` is unaffected — worth re-testing if you ever change the rewrite.

## Check-in

A "Check in here" button under the route map records where you are and shows it as a pulsing dot on the map, labelled by the nearest overnight stop ("Near Bennar Beach · 2 hours ago"). It's a one-off reading taken when you tap it — nothing tracks you in the background, and the app never asks for your location unprompted.

Only someone with the password can check in or clear the pin; everyone else just sees it. **The pin is visible to anyone with the link**, so treat it as public — it's roughly where the family is right now. The Clear button removes it.

The dot is drawn beneath the night markers on purpose, so checking in at a campsite haloes that night's number rather than covering it. A check-in outside the map's bounds is stored but not drawn, since clamping it to an edge would show a position that isn't true; the caption says "off the map" instead.

Geolocation needs a secure context, so this only works over https or on localhost — see the phone-testing note above.

## Photos and access

There is one level of access, controlled by a single shared password:

- **Anyone with the URL** can browse the route, the bookings, and the whole photo gallery. Nothing is hidden behind the password. Tapping a thumbnail opens a full-screen viewer with arrows, swipe, and arrow-key/Escape support, running across every photo in date order rather than stopping at the end of a day.
- **Anyone who enters the password** can upload and delete photos. Unlock it from the Photos tab.

The password lives in `ADMIN_PASSWORD` and is checked server-side on every `POST`/`DELETE` to `/api/photos`. Entering it only unlocks the UI optimistically — a wrong one is rejected on the first upload and cleared.

Location and capture time come from each photo's own EXIF (`src/exif.js`), which is why the app never asks the browser for location permission. The day a photo is filed under is worked out for you, from its capture date, then the nearest overnight stop within 60 km, then today's date. You pick a photo, the app shows which day it landed on, and you confirm — a "Wrong day?" link reveals the manual picker, which opens automatically on the rare photo carrying neither a date nor a location.

One caveat worth knowing on iPhone: photos chosen from the **Photo Library** keep their GPS tags, but a photo taken through the in-browser camera has no location data at all. The file inputs deliberately omit the `capture` attribute so iOS offers the library rather than jumping straight to the camera.

## Local development

```bash
npm install
npm run dev          # starts vite on localhost:5173
```

Checkbox state and photos won't work under plain `npm run dev` — there's no KV or R2 in the vite dev server, so state falls back to localStorage and uploads have no endpoint. To exercise the real Functions locally, build first and let wrangler serve the output:

```bash
npm run build
npx wrangler pages dev
```

That spins up a local Cloudflare-style runtime handling `/api/state` against a local KV and `/api/photos` against a local R2 bucket, with data under `.wrangler/state`.

Note there's no hot reload in this mode — rerun `npm run build` after a change. And don't append `-- npm run dev`: `pages_build_output_dir` in `wrangler.toml` already names the directory, and wrangler rejects being given both a directory and a proxy command.

The local password comes from `.dev.vars` in the project root, which is gitignored:

```
ADMIN_PASSWORD=wales2026
```

Use a different value in production — see step 5 below.

### Testing on a phone without deploying

EXIF behaviour differs between picking a photo from the library and taking one in the browser, so it's worth checking on a real handset. Bind the dev server to the network instead of localhost:

```bash
npm run build
npx wrangler pages dev --ip 0.0.0.0
```

Then browse to `http://<your-machine-ip>:8788` from the phone on the same wi-fi — wrangler prints the LAN address on startup.

Photo uploads work fine over plain http, but **check-in does not**: browsers only expose geolocation in a secure context, which means https or localhost. Over a LAN IP `window.isSecureContext` is false and the button will say so rather than silently failing. Test check-in on the deployed site.

Upload one photo from the library and one via "Take Photo", then check `/api/photos` to see which records came back with `lat`/`lng`.

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

### 5. Create the R2 bucket and set the password

```bash
npx wrangler r2 bucket create wales-photos
```

- Pages → your project → **Settings** → **Functions** → **R2 bucket bindings**
- Variable name: `PHOTOS`, bucket: `wales-photos`

Then add the password as an encrypted secret:

- Pages → your project → **Settings** → **Environment variables** → **Add variable**
- Name: `ADMIN_PASSWORD`, value: whatever you're sharing with the family, type: **Secret**

Cloudflare can't show a secret again once saved, so if you forget it, overwrite it with a new value and redeploy. Without this set, `/api/photos` returns 503 on upload rather than allowing unauthenticated writes.

### 6. Custom domain
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
├── functions/api/
│   ├── state.js            → Pages Function (read/write KV)
│   ├── auth.js             → validates the password at unlock time
│   ├── checkin.js          → GET latest pin (public), POST/DELETE (gated)
│   └── photos/
│       ├── index.js        → GET list metadata, POST upload (password-gated)
│       └── [id].js         → GET one photo, DELETE it (password-gated)
├── public/
│   └── _redirects          → SPA fallback so /photos survives a refresh
├── src/
│   ├── App.jsx             → main React component (all trip data + UI)
│   ├── api.js              → hooks for shared state, auth, and photos
│   ├── exif.js             → reads GPS + capture time out of a JPEG
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
- Checkboxes have no auth — anyone with the URL can toggle them (fine for family sharing). Photos are password-gated; the checkbox API is not.
- One shared password for both uploading and deleting, so anyone you give it to can delete photos too
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
