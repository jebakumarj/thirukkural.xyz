# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[semantic versioning](https://semver.org/spec/v2.0.0.html).

The version shown at the foot of the app's நூலைப் பற்றி page names the build it
is running, so a report can be tied to a release.

## [Unreleased]

## [1.0.1] - 2026-09-27

Kurals can now be grouped into the reader's own lists, search moves into the
phone tab bar, and the shared picture follows the theme, gains a decorated
border and copies properly on a desktop. Nothing already saved is lost:
favourites carry over untouched, and lists start empty.

### Added

- **Lists (tags)** for grouping kurals under names of the reader's choosing,
  such as அன்பு, கல்வி or நட்பு.
  - A new tag button sits beside the heart on every kural card, and as
    **பட்டியல்** among the actions on the kural page.
  - It opens a panel (a bottom sheet on phones, a centred panel on wider
    screens) that lists விருப்பம் and every list with a checkbox and a count,
    so one kural can sit in favourites and in any number of lists at once.
  - A new list can be named and created from the same panel, and the kural is
    added to it straight away. Giving an existing list's name adds the kural
    to that list rather than making a second one.
  - The tag button turns blue once the kural is in at least one list.
- **List tabs on the favourites page.**
  - A row of tabs: விருப்பம் first, then each list with its count. On phones
    the row scrolls sideways.
  - Each list has its own address, `/favourites?list=<id>`, so it can be
    bookmarked.
  - **புதிய பட்டியல்** creates an empty list and opens it. A list can be
    renamed or deleted from its own tab; deleting asks first, and leaves its
    kurals in favourites and in every other list.
  - An empty list says how to add kurals to it and links to search.
- **Search in the phone tab bar**, which now has five tabs: முகப்பு, அதிகாரம்,
  குறள், தேடு, விருப்பம்.
- **A decorated border around the shared picture**: a narrow band around the
  card with a mandala on each corner (large on one diagonal, small on the
  other), a beaded border with a fine rule inside it, and a soft shadow that
  lifts the card. The card itself stays plain, so the text is never drawn over
  the ornament.
- **Google Analytics**, loaded only on the production host, so forks and local
  builds report nothing.

### Changed

- **The shared picture follows the app's theme.** It takes the colours on
  screen at the moment of sharing, so a dark theme, whether chosen by hand or
  followed from the system, gives a dark picture. Until now it was always
  light.
- **On a desktop, share copies the picture to the clipboard** instead of
  opening the system share sheet, and says so: படம் நகலெடுக்கப்பட்டது —
  ஒட்டலாம். It pastes straight into a chat, a document or an email. Phones keep
  the share sheet, with the link and a line about the app. Each falls back to
  the other, then to text, where the browser cannot manage it. The copy button
  (நகலெடு) still copies the text.
- On phones the header's search button is gone, since search is in the tab
  bar. Wide screens keep it in the header.

### Fixed

- **Kural 467**, மு. வரதராசனார் உரை: "வழிகளை எண்ணிய பிறகே" now reads "வழிகளையும்
  எண்ணிய பிறகே", as the commentary has it.
- Copying the picture put a text version on the clipboard with it, so most
  paste targets pasted the text and dropped the picture. Only the picture is
  copied now; it already carries the words and the address.
- Where Safari copied the picture, the copy was refused: it started only after
  the picture was drawn, and by then Safari no longer treats it as part of the
  reader's click. The copy now starts at the click, and the picture follows
  when it is ready.
- Long commentary lines on the shared picture could run past the card's right
  margin. They now wrap within the card.
- **A kural on the shared picture is always two lines.** A long first line used
  to wrap, leaving the couplet on three lines. Now the two lines are never
  broken: they shrink together, only as far as the longer one needs, to fit
  the card. The picture is also wider, 1280px instead of 1080px, so most
  couplets keep their full size; even the longest in the book stays well
  above the size of the commentary.

## [1.0.0] - 2026-09-20

The first release of the rebuilt site: all 1,330 couplets with three
commentaries, as a mobile-first web app that works without an internet
connection.

This replaces the earlier API-backed version. The book is now compiled into the
site itself — there is no API, no database and no application server behind it,
which is also what lets it work offline.

### Added

- **Kural of the day** on the home page, chosen from the reader's own date.
- **Browsing down the book** — பால் → இயல் → அதிகாரம் → குறள். Each step carries
  its filter to the next as a removable chip, with the result count beside it.
- **A book tree** in a sidebar on wide screens and behind the hamburger on
  narrow ones; choosing a chapter opens its ten kurals with the row marked.
- **Search** across the couplets, all three commentaries and the chapter names,
  narrowed by பால்/இயல்/அதிகாரம், with a number jumping straight to that kural.
  Searches are shareable as `/search?q=…&adhikaram=…`.
- **Cards** showing மு. வரதராசனார் உரை, with a chevron that opens சாலமன்
  பாப்பையா and மு. கருணாநிதி. Each card remembers its own state.
- **Sharing a kural as a picture**, drawn to match the card, with the link and a
  line about the app. Falls back to text, then the clipboard, as the browser
  allows.
- **Copying** the couplet with whichever commentaries are open, formatted with
  its attribution and link.
- **Favourites**, kept in the reader's own browser with a count on the tab bar.
- **Installation** as a PWA, with an install suggestion, app shortcuts, a share
  target, and the whole book readable offline after the first visit.
- **Light and dark themes**, following the system or set by hand.
- **A help and contact page**, reachable from the foot of the navigation.

### Technical

- Angular 22: standalone components, zoneless, signals throughout.
- Every route prerendered to static HTML — 1,488 pages, including one per kural,
  so each couplet has its own indexable, shareable URL with its own title,
  description, canonical and JSON-LD.
- A first visit is about 400 KB compressed: roughly 93 KB of app shell and the
  whole corpus as a further ~290 KB chunk. After that the service worker serves
  everything from cache.
- Search runs entirely in the browser: there is no search server, and the
  corpus is never queried over the network.
- The share image is drawn on a canvas rather than screenshotting the page — no
  extra library, and it works offline.
- Plain CSS with custom properties, inline SVG icons, and self-hosted Tamil font
  subsets. No CSS framework and no icon font; every asset the app needs is
  served from its own origin.
- The corpus is validated on every test run: 3 paals, 13 iyals, 133 adhikarams,
  exactly ten kurals each, and all three commentaries present on all 1,330.
- `npm run check:layout` drives the built site in Chrome at phone, tablet and
  desktop widths, reporting sideways overflow and undersized tap targets.

[Unreleased]: https://github.com/jebakumarj/thirukkural.xyz/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/jebakumarj/thirukkural.xyz/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/jebakumarj/thirukkural.xyz/releases/tag/v1.0.0
