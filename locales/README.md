# Locale catalogs

Each catalog is a flat JSON object keyed by the English source string that
appears inside a `ui.loc(...)` / `ui.locc(...)` / `ui.locf(...)` call, mapping
that key to its translation for one language.

- `en.json` is generated -- run `npm run loc:strings` to regenerate it
  from the `files` listed in `pxt.json`; do not edit it by hand.
- Every other file (`fr.json`, ...) is the translation catalog for one
  language, keyed by the same English strings. A key missing from a catalog
  falls back to the English string at runtime, so partial catalogs are safe.

Key-cap translations render on fixed-width keys, so keep them at most one
character longer than the English source (for example `space` -> `espace`,
`DEL` -> `SUP`).

## Adding a new caption

Wrap the caption literal in `ui.loc(...)` where the control renders it, then run
`npm run loc:strings` to regenerate `en.json`. Add translations to the
`<lang>.json` catalogs, keyed by the source string.

An application that consumes this library can override any of these translations
from its own catalogs: the app catalog layer wins over the library layers when
they are merged for a build.

## Keyboard character sets

`charsets.json` holds the per-language on-screen-keyboard character data. It is
consumed at build time into the text-entry `_loc` charset fields
(`alphabetLower`, `alphabetUpper`, `accentsLower`, `accentsUpper`, `symbols`),
which drive the letter, accent, and symbol pages of the text-entry keyboard.

The file is a JSON object keyed by language code. Each language maps to an
object whose fields are all optional; an omitted field inherits the module
default (ASCII `a-z` / `A-Z` for the alphabet, `-_.,!?@#` for symbols). Base
language keys serve their regional variants (`es` serves `es-ES` and `es-MX`,
`fr` serves `fr` and `fr-CA`, `pt` serves `pt-BR` and `pt-PT`); add a regional
key only where a region genuinely differs.

Field contracts:

- `alphabetLower` / `alphabetUpper` are the letter page. String order is key
  order. The two strings are case-parallel: equal code-point length, with the
  character at each index the lower and upper form of the same letter.
- `accentsLower` / `accentsUpper` are additional accepted accented pairs, under
  the same equal-length, positionally-paired contract. These are accepted by the
  input filter (and case-normalized) but are not yet rendered as keys.
- `symbols` is the symbol page, in key order.

The letter page shows at most 39 letters (3 rows of 13); letters beyond that are
filter-accepted but not drawn. This bound drives the alphabet-vs-accents split:
an alphabet that fits within 39 places its diacritic letters in `alphabet*` at
their conventional positions, while a larger set keeps the base letters in
`alphabet*` and moves the overflow diacritic forms into `accents*`.
