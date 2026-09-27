# thirukkural.xyz

திருக்குறள் — all 1,330 couplets with three commentaries, as a mobile-first,
offline-capable web app.

The whole book is compiled into the site. There is no API, no database and no
application server at runtime: the build prerenders 1,488 static pages, and any
web server that can hand out files can serve them.

## How it is put together

| Concern | Decision |
| --- | --- |
| Framework | Angular 22, standalone components, zoneless, signals |
| Data | `src/data/*.json`, imported at build time into a lazy chunk (~224 KB over the wire) |
| Rendering | Static prerendering of every route (`outputMode: static`) — no Node in production |
| Styling | Plain CSS with custom properties, mobile-first, light and dark themes, blue palette carried over from the original app. No CSS framework |
| Icons | Inline SVG components. No icon font. The app mark is an ஓலைச்சுவடி plaque, drawn as shapes so it needs no font |
| Fonts | Mukta Malar, self-hosted, Tamil and Latin subsets only |
| Search | Client-side over the whole corpus; there is no search server |
| Sharing | The card is drawn on a canvas, in the current theme's colours, and shared as a PNG with the link; no screenshot library |
| Offline | Angular service worker precaches the shell, the corpus, the fonts and the icons |
| Storage | Favourites, lists and preferences in `localStorage`, guarded so the app works without it. Only kural numbers are stored, so the shell never needs the corpus |

A first visit is about 400 KB compressed: roughly 93 KB of app shell, and the
whole corpus as a further ~290 KB chunk, preloaded alongside it. After that the
service worker serves everything from the cache, online or not.

## What it does

- **Kural of the day** on the home page, from the reader's own date.
- **Browsing** down the book: பால் → இயல் → அதிகாரம் → குறள். Each step carries
  its filter to the next as a removable chip, with the result count beside it.
- **A book tree** in a left sidebar on wide screens, and behind the hamburger on
  narrow ones. Choosing a chapter opens its kurals with the row marked current.
- **Search** across couplets, commentaries and chapter names, with the same
  பால்/இயல்/அதிகாரம் filter behind a filter button. Typing a number jumps to that
  kural. Shareable as `/search?q=…&adhikaram=…`.
- **Cards** show the couplet with மு.வ. உரை; a chevron opens the other two.
- **Share** draws the card as a picture, in the light or dark theme, on a ground
  of corner mandalas and a beaded border. On a phone it goes to the share sheet
  with the link and a line about the app; on a desktop it goes on the
  clipboard, ready to paste. Either steps down to the other, then to text, as
  the browser allows. **Copy** takes the couplet and whichever commentaries
  are open, as text.
- **Favourites** in this browser, with a count on the tab bar.
- **Lists (tags)**: named groups of kurals. The tag button on a card adds that
  kural to any number of lists or starts a new one. The favourites page shows
  each list as a tab, where it can be renamed or deleted.
- **A tab bar on phones** — home, chapters, kurals, search and favourites.
- **Installable** as a PWA, with shortcuts and a share target, and fully usable
  offline after the first visit.

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

`src/app/core/version.ts` is generated, not committed. `npm start`, `npm test`
and every build write it from `package.json` and the current git commit, and
the About page shows it. Running `ng serve` or `ng test` directly skips that
step, so on a fresh clone run `npm run version` once first.

### Regenerating assets

```bash
npm run fonts        # re-download the font subsets and rewrite src/fonts.css
npm run icons        # re-render the icon set, favicon and link-preview image
```

Both write files that are committed, so an ordinary build never touches the
network. Regenerating the link-preview image needs a Tamil font on the machine
(Nirmala UI on Windows, Noto Sans Tamil elsewhere); the icons themselves are
plain shapes and need none.

### The corpus

`src/data/kural.json` and `src/data/structure.json` are the source of truth.
They were extracted from the old MySQL-backed API and validated: 3 paals,
13 iyals, 133 adhikarams, exactly 10 kurals each, and all three commentaries
present on all 1,330 kurals. `src/app/core/corpus.spec.ts` asserts those
invariants on every test run.

To regenerate them from a database dump, produce the same shapes and the tests
will tell you if anything is off.

## Hosting it

`npm run build` writes the finished site to `dist/thirukkural/browser`: plain
static files, every route already rendered to its own `index.html`. Serve that
folder with whatever you like — there is nothing to run alongside it.
`npm run package` tars it up if you want to move it in one piece.

Two things are worth setting on whatever serves it:

- **Do not cache `/index.html` or `/ngsw.json`.** Everything else carries a
  hash in its filename and can be cached for a year, but if those two are
  cached, visitors stay on an old service worker and never see a new build.
- **Return a real 404 for unknown paths**, falling back to `/index.csr.html` —
  the empty client-rendered shell — so the app draws its own not-found page
  while the status code stays honest for crawlers.

## Routes

| Path | Pages | What it is |
| --- | --- | --- |
| `/` | 1 | Kural of the day, computed from the reader's date |
| `/kural` | 1 | The kurals of one adhikaram, chosen from the tree or the filter dialog |
| `/kural/:id` | 1330 | One couplet with all three commentaries |
| `/adhikaram`, `/adhikaram/:id` | 134 | The 133 chapters |
| `/iyal`, `/iyal/:id` | 14 | The 13 chapter groups |
| `/paal`, `/paal/:id` | 4 | அறம், பொருள், இன்பம் |
| `/search` | 1 | Client-side search with filter and number jump |
| `/favourites` | 1 | Saved kurals and the reader's lists (`?list=<id>`), this browser only |
| `/about` | 1 | The book, its figures, and reading preferences |

The list pages link into the filtered views (`/kural?adhikaram=7`), while
`/adhikaram/:id` and the other detail pages stay as the prerendered, canonical
URLs that crawlers follow.

## Contact

Suggestions, typos, corrections and rights queries: <admin@thirukkural.xyz>,
or open an issue. The address is also on the app's நூலைப் பற்றி page.

## Changelog

What changed in each release: [CHANGELOG.md](CHANGELOG.md).

## Licence

The code is MIT licensed — see [LICENSE](LICENSE).

The texts are a separate matter: the Kural is in the public domain, but the
three commentaries are modern works that are **not** covered by that licence.
[CONTENT.md](CONTENT.md) sets out where the data came from and what that means
if you reuse this repository.
