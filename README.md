# thirukkural.xyz

திருக்குறள் — all 1,330 couplets with three commentaries, as a mobile-first,
offline-capable web app.

The whole book is compiled into the site. There is no API, no database and no
application server at runtime: `ng build` prerenders 1,487 static pages and
nginx serves them.

## How it is put together

| Concern | Decision |
| --- | --- |
| Framework | Angular 22, standalone components, zoneless, signals |
| Data | `src/data/*.json`, imported at build time into a lazy chunk (~224 KB over the wire) |
| Rendering | Static prerendering of every route (`outputMode: static`) — no Node in production |
| Styling | Plain CSS with custom properties, mobile-first, light and dark themes, blue palette carried over from the original app. No CSS framework |
| Icons | Inline SVG components. No icon font. The app mark is a palm-leaf manuscript, drawn as shapes so it needs no font |
| Fonts | Mukta Malar, self-hosted, Tamil and Latin subsets only |
| Search | Client-side over the whole corpus; nothing leaves the device |
| Offline | Angular service worker precaches the shell, the corpus, the fonts and the icons |
| Storage | Favourites and preferences in `localStorage`, guarded so the app works without it |

Initial load is about 85 KB compressed; the corpus arrives in a second, cached
chunk.

## Working on it

```bash
npm install
npm start            # dev server on http://localhost:4200
npm test             # unit tests (vitest)
npm run build        # production build + sitemap.xml
npm run preview      # build, then serve dist/ on http://localhost:4300
npm run check:layout # drive the built site in Chrome at phone, tablet and
                     # desktop widths; reports sideways overflow and
                     # undersized tap targets (needs a served build)
```

The service worker is disabled in development, so test install and offline
behaviour against `npm run preview`.

### Regenerating assets

```bash
npm run fonts        # re-download the font subsets and rewrite src/fonts.css
npm run icons        # re-render the icon set, favicon and link-preview image
```

Both write files that are committed, so an ordinary build never touches the
network.

### The corpus

`src/data/kural.json` and `src/data/structure.json` are the source of truth.
They were extracted from the old MySQL-backed API and validated: 3 paals,
13 iyals, 133 adhikarams, exactly 10 kurals each, and all three commentaries
present on all 1,330 kurals. `src/app/core/corpus.spec.ts` asserts those
invariants on every test run.

To regenerate them from a database dump, produce the same shapes and the tests
will tell you if anything is off.

## Deploying

See [deploy/server-setup.md](deploy/server-setup.md) for the one-time server
setup. After that:

```bash
cp deploy/.env.example deploy/.env    # set DEPLOY_HOST
npm run deploy
```

Each deploy uploads a timestamped release and flips the `current` symlink, so
rolling back is re-pointing that symlink at the previous release. Pushing to
`main` does the same thing through `.github/workflows/deploy.yml`.

Two cache rules in [deploy/nginx.conf](deploy/nginx.conf) matter more than the
rest: `index.html` and `ngsw.json` must not be cached, or visitors stay on an
old service worker; everything with a hashed filename is cached for a year.

## Routes

| Path | Pages | What it is |
| --- | --- | --- |
| `/` | 1 | Kural of the day, computed from the reader's date |
| `/kural/:id` | 1330 | One couplet with all three commentaries |
| `/adhikaram`, `/adhikaram/:id` | 134 | The 133 chapters |
| `/iyal`, `/iyal/:id` | 14 | The 13 chapter groups |
| `/paal`, `/paal/:id` | 4 | அறம், பொருள், இன்பம் |
| `/kural` | 1 | All kurals of a chosen adhikaram, with பால்/இயல்/அதிகாரம் dropdowns |
| `/search` | 1 | Client-side search with the same filter behind a filter button; shareable as `/search?q=…&adhikaram=…` |
| `/favourites` | 1 | Saved kurals, this browser only |
| `/about` | 1 | The book, plus commentary and theme preferences |
