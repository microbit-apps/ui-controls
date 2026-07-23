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
