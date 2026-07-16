# City catalog

The picker catalog is a union of four explicit locale markets:

- `ko`: 167 Korean choices, grouped by the 17 first-level administrative divisions.
- `en`: 90 cities from the United States, United Kingdom, Canada, Australia, and
  New Zealand, grouped by country in that order.
- `ja`: 50 Japanese cities, grouped by prefecture.
- `zh`: all 333 mainland prefecture-level divisions, the four direct-administered
  municipalities, Hong Kong, and Macao (339 choices), grouped by the 31 mainland
  province-level divisions and the two special administrative regions.

`src/lib/city-markets.json` is the source of truth for locale membership, group labels,
and display order. Administrative group keys use current ISO 3166-2 codes. All
official subdivisions are declared, while the UI omits groups that have no catalog
cities.

The generator writes one module per locale: `cities.ko.generated.ts`,
`cities.en.generated.ts`, `cities.ja.generated.ts`, and
`cities.zh.generated.ts`. The locale layout loads exactly one module on the server and
serializes only that catalog to the browser. The other locale catalogs are therefore
absent from that locale's client payload.

`cities.curated.json` pins the stable baseline display names, country labels,
coordinates, and time zones. `cities.selected.json` adds explicitly chosen GeoNames
records. Both files contain only the Korean, English, and Japanese markets; Chinese
administrative choices have their own single source of truth described below.

`cities.kr-municipalities.json` is the complete Korean municipality roster: 75 cities,
82 counties, and the two Jeju administrative cities. The counts follow the Ministry of
the Interior and Safety's _Local-government administrative districts and population
status_ (2024-12-31), as cited in the
[National Assembly Budget Office reference](https://www.nabo.go.kr/board/file/down.do?fid=33318980).
The eight upper-level choices (Seoul, the six metropolitan cities, and Sejong) remain
separate, producing 167 Korean choices.

Each Korean roster entry pins its GeoNames ADM2 identity. New entries also pin a
representative coordinate source when GeoNames provides a city/county office,
county-seat town office, populated place, or seat ADM3 record. When
`coordinateGeonameId` is omitted, the ADM2 reference point is used. Existing curated
coordinates take precedence.

`cities.cn-divisions.json` is the Chinese administrative roster. It pins the official
Simplified Chinese name, six-digit administrative-division code, administrative level,
province-level ISO 3166-2 group, stable key, GeoNames administrative identity, and a
representative populated-place coordinate for every selectable entry. Province-level
regions are picker groups; the four direct-administered municipalities and the two
special administrative regions are the single selectable choice in their respective
groups. Taiwan is outside the configured `zh` market.

The mainland roster follows the 2025 administrative-code snapshot in
[`yescallop/areacodes`](https://github.com/yescallop/areacodes), sourced from China's
National Place Names Information Database and released under CC0. Its composition is
cross-checked against the National Bureau of Statistics' _China Statistical Yearbook
2025_: 293 prefecture-level cities, 7 prefectures, 30 autonomous prefectures, and 3
leagues, for 333 prefecture-level divisions. See
`apps/stella/LICENSES/ChinaAdministrativeDivisionCodes.txt` for provenance.

Run from `apps/stella`:

```sh
bun run gen:cities
```

The first run downloads GeoNames `cities15000.zip` and the supplemental `KR.zip` and
`CN.zip` country dumps into the ignored `scripts/.cache` directory. Later runs reuse
the same snapshots so output stays stable. Use
`bun run gen:cities -- --refresh-source` only for an intentional source refresh, and
review the generated diff. Run the generator with `--check` to verify that every
committed locale module matches the cached sources.

Selection and maintenance rules:

- Add a city only to its locale market and assign every region-grouped city a pinned
  ISO 3166-2 `regionCode`.
- Preserve localized CJK city and country labels in the curated baseline.
- Keep the Korean roster at exactly 75 `city`, 82 `county`, and 2
  `administrativeCity` entries unless a confirmed official reorganization changes
  those counts. Do not add districts (`구`).
- Keep the Chinese roster aligned to the pinned official snapshot. Change an
  administrative code, name, or count only as an intentional source refresh, and
  review official reorganization notices before accepting the generated diff.
- Treat Chinese province-level regions as groups and prefecture-level regions as
  choices. Direct-administered municipalities, Hong Kong, and Macao are the
  province-level exceptions that are also selectable.
- Use province-qualified names and keys only where needed to disambiguate places,
  such as Gyeonggi Gwangju and the two Goseong counties.
- Prefer a pinned city/county-office coordinate for Korean additions. Fall back in
  order to a county-seat town office or populated place, a seat ADM3 record, and
  finally the municipality's ADM2 reference point.
- Add other market cities by GeoNames ID and pin public labels in the selection
  manifest rather than depending on a mutable population rank or upstream name.
- Exclude city sections and metro subdivisions that duplicate a selectable parent
  city.
- Keep every time zone as a valid IANA identifier. Mainland China always uses
  `Asia/Shanghai`; Hong Kong uses `Asia/Hong_Kong`; Macao uses `Asia/Macau`.
- Keep GeoNames attribution in `apps/stella/LICENSES/GeoNames.txt` and the generated
  header.
