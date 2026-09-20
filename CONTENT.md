# The texts in this app

## The Kural

The 1,330 couplets are attributed to திருவள்ளுவர் and are roughly two thousand
years old. The text is in the public domain.

## The commentaries

Each kural is shown with three prose commentaries (உரை):

| Commentary | Author | Status |
| --- | --- | --- |
| மு. வரதராசனார் உரை | Mu. Varadarajan (1912–1974) | Modern work, rights with the author's estate and publishers |
| சாலமன் பாப்பையா உரை | Solomon Pappaiah | Modern work, rights with the author and publishers |
| மு. கருணாநிதி உரை | M. Karunanidhi (1924–2018) | Modern work, rights with the author's estate and publishers |

These are widely reproduced across Tamil books, sites and apps, and they are
shown here with the author named above every passage. They are **not** covered
by this repository's MIT licence, and nothing here grants permission to
redistribute them.

If you are reusing this repository, either obtain your own permission for these
texts or replace `src/data/kural.json` with commentaries you have the right to
publish. The structure is simple and `src/app/core/corpus.spec.ts` will tell you
if a replacement is malformed.

If you hold rights in one of these commentaries and want it removed or
attributed differently, write to <admin@thirukkural.xyz> or open an issue on
the repository.

## Where the data came from

`src/data/kural.json` and `src/data/structure.json` were exported from the
MySQL-backed API that served the previous version of this site, then normalised
and validated. The tests assert the structure on every run: 3 paals, 13 iyals,
133 adhikarams, exactly ten kurals each, and all three commentaries present on
all 1,330 kurals.

## The font

Mukta Malar, by Ek Type, is used under the SIL Open Font License 1.1. The
subset files in `public/fonts/` were produced from the Google Fonts release by
`scripts/fetch-fonts.mjs`.
