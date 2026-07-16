# Birthplace catalog generation

Stella builds a static, locale-scoped birthplace catalog from GeoNames. The browser
never calls a geocoder or sends a birth-place query to a third party. Each locale
catalog is emitted as its own JavaScript chunk and is loaded only when the birthplace
combobox is opened.

## Product policy

`src/lib/birthplace-markets.json` is the source of truth for country coverage,
group labels, GeoNames-to-ISO first-level subdivision mappings, and the short popular
list shown before the user types.

| UI locale | Allowed birthplace countries                                  | Combobox group                       | Selected value                                                          |
| --------- | ------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `ko`      | South Korea                                                   | first-level administration           | populated place/locality                                                |
| `ja`      | Japan                                                         | prefecture                           | populated place/locality                                                |
| `zh`      | mainland China, Hong Kong, Macao                              | province-level administration or SAR | populated place/locality                                                |
| `en`      | United States, United Kingdom, Canada, Australia, New Zealand | country                              | populated place/locality, disambiguated with lower-level administration |

Locale is intentionally a market boundary, not just a display-language preference.
A saved or shared profile is accepted only when its country belongs to the current
locale's configured market.

## Sources and inclusion rules

The generator downloads these GeoNames sources into the ignored `scripts/.cache`
directory:

- `cities1000.zip`: places with population above 1,000 plus administrative seats down
  to PPLA3;
- `admin1CodesASCII.txt` and `admin2Codes.txt`: administrative context and source-code
  identity;
- country-specific alternate-name archives for Korea, Japan, mainland China,
  Hong Kong, and Macao: localized display and search names.

The selectable value is a GeoNames populated-place record. Historical, abandoned,
destroyed, and `PPLX` city-section records are excluded. A record included only as an
administrative seat with a reported population below 1,000 is retained as coverage
fallback and marked `administrativeSeat`; all other records are marked `locality`.
This distinction is persisted with the birth profile and does not change the chart
calculation, which always uses the selected record's pinned coordinates and IANA time
zone.

Mainland Chinese records are normalized to the official single standard-time zone
`Asia/Shanghai`; Hong Kong and Macao retain `Asia/Hong_Kong` and `Asia/Macau`.
Coordinates are rounded to four decimal places (roughly 11 m at the equator), which is
well beyond the precision needed for the chart calculation while keeping generated
data compact.

## Generate

From `apps/stella`:

```bash
bun run gen:birthplaces
```

The command writes:

- `src/lib/birthplaces.ko.generated.ts`
- `src/lib/birthplaces.en.generated.ts`
- `src/lib/birthplaces.ja.generated.ts`
- `src/lib/birthplaces.zh.generated.ts`

Generated modules use compact tuples and include SHA-256 hashes for every source used
by that locale. Normal generation reuses the cached source snapshots, so output is
deterministic.

Use an intentional upstream refresh only when reviewing a catalog update:

```bash
bun run gen:birthplaces -- --refresh-source
```

Then inspect count changes, representative labels, group coverage, and the generated
source hashes before committing. To verify that committed output matches the cached
sources without rewriting files:

```bash
bun run gen:birthplaces -- --check
```

The generator rejects invalid market definitions, duplicate IDs, missing groups,
missing popular entries, invalid coordinates/time zones, and suspiciously low country
coverage. Country totals are minimum guards rather than fixed counts because GeoNames
is a maintained dataset.

## Attribution

GeoNames data is licensed under CC BY 4.0. Keep
`apps/stella/LICENSES/GeoNames.txt` and the attribution comments in generated modules
when changing the catalog pipeline.
