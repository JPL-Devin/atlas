# Atlas IV Changelog

All notable changes to Atlas are recorded here, newest first and grouped by month.

- PR links of the form `NASA-PDS/atlas#N` point at the upstream
  [NASA-PDS/atlas](https://github.com/NASA-PDS/atlas) repository; `JPL-Devin/atlas#N`
  point at [JPL-Devin/atlas](https://github.com/JPL-Devin/atlas).
- Routine Dependabot bumps are summarized per month rather than listed individually.
- The user-facing summary shown in the app's **About → Release Notes** view lives in
  `src/config/releaseNotes.json`; add an entry there for any change users should notice.

## 2026-10

### Added
- Release Notes view in the About modal, grouped by month, with a blue badge on the
  Topbar info button when the app version is newer than the one the user last viewed
  release notes on.
- Artemis II record detail profile: Overview title, description and at-a-glance layout
  tailored to Artemis II products ([JPL-Devin/atlas#62](https://github.com/JPL-Devin/atlas/pull/62)).

### Changed
- Added top spacing above the General Fields filter on the record details page
  ([JPL-Devin/atlas#63](https://github.com/JPL-Devin/atlas/pull/63)).

### Fixed
- Record version selectors list each PDS4 product version once
  ([JPL-Devin/atlas#61](https://github.com/JPL-Devin/atlas/pull/61)).

## 2026-09

### Added
- Quick Links menu in the Topbar to copy, open or download the current page, record,
  archive path and API query ([JPL-Devin/atlas#30](https://github.com/JPL-Devin/atlas/pull/30)).
- Record cards open in new tabs on middle/ctrl-click, and cards and Archive Explorer rows
  have right-click context menus (copy, open, add/remove from cart)
  ([JPL-Devin/atlas#31](https://github.com/JPL-Devin/atlas/pull/31)).
- In-browser previews of CSV, TAB, TXT, PDF, MP4, WAV and M4A source products on the record
  page, and type-aware thumbnails in search and cart
  ([JPL-Devin/atlas#32](https://github.com/JPL-Devin/atlas/pull/32)).
- "Open in Archive Explorer" links from Search, Record and Cart
  ([JPL-Devin/atlas#42](https://github.com/JPL-Devin/atlas/pull/42)); switching to the
  Archive Explorer from a record opens it at that record
  ([JPL-Devin/atlas#48](https://github.com/JPL-Devin/atlas/pull/48)).
- Archive Explorer type-aware file icons and inline audio/video playback in Preview
  ([JPL-Devin/atlas#53](https://github.com/JPL-Devin/atlas/pull/53)).
- Archive Explorer Preview "Add to cart" works for whole bundles and volumes
  ([JPL-Devin/atlas#45](https://github.com/JPL-Devin/atlas/pull/45)).
- Start Time filter shown by default, with date-and-time (UTC) support
  ([JPL-Devin/atlas#38](https://github.com/JPL-Devin/atlas/pull/38),
  [JPL-Devin/atlas#50](https://github.com/JPL-Devin/atlas/pull/50)).
- Flight Day filter shown by default in Atlas search
  ([JPL-Devin/atlas#46](https://github.com/JPL-Devin/atlas/pull/46)).
- Artemis II support: "Artemis II" mission/spacecraft display names, filename breakdown on the
  record page, and a link to the Artemis II Science Data User Guide
  ([JPL-Devin/atlas#43](https://github.com/JPL-Devin/atlas/pull/43),
  [JPL-Devin/atlas#35](https://github.com/JPL-Devin/atlas/pull/35),
  [JPL-Devin/atlas#54](https://github.com/JPL-Devin/atlas/pull/54),
  [JPL-Devin/atlas#59](https://github.com/JPL-Devin/atlas/pull/59)).
- SCALPSS (Firefly Blue Ghost Mission 1) display names and filename breakdown, plus short/long
  display names with ellipsized long filter labels
  ([JPL-Devin/atlas#27](https://github.com/JPL-Devin/atlas/pull/27)).
- Search results are sorted by ML novelty score by default, with friendly, grouped sort labels
  ([JPL-Devin/atlas#24](https://github.com/JPL-Devin/atlas/pull/24)).

### Changed
- Repeated searches are cached so returning to a previous filter state is instant
  ([JPL-Devin/atlas#36](https://github.com/JPL-Devin/atlas/pull/36)).
- The selected results view (Grid/List/Table/Map) is kept when returning from a record, and any
  Table cell opens its record ([JPL-Devin/atlas#37](https://github.com/JPL-Devin/atlas/pull/37)).
- Copied Python / CURL / Node Fetch snippets include usage comments; "Fetch" is renamed
  "Node Fetch" ([JPL-Devin/atlas#47](https://github.com/JPL-Devin/atlas/pull/47)).
- Archive Explorer preview images show a loading spinner and stay static
  ([JPL-Devin/atlas#52](https://github.com/JPL-Devin/atlas/pull/52)).
- Date-only Start Time picker hides the Date/Time tabs
  ([JPL-Devin/atlas#56](https://github.com/JPL-Devin/atlas/pull/56)).
- The short-lived "All Products / Browseable Images" results toggle was added and then removed
  ([JPL-Devin/atlas#33](https://github.com/JPL-Devin/atlas/pull/33),
  [JPL-Devin/atlas#44](https://github.com/JPL-Devin/atlas/pull/44)).
- Build tooling moved from the CRA-era webpack pipeline to Vite 7, preserving runtime
  `APP_CONFIG` injection and CSP nonces; tooling scripts converted to ESM
  ([NASA-PDS/atlas#392](https://github.com/NASA-PDS/atlas/pull/392),
  [JPL-Devin/atlas#29](https://github.com/JPL-Devin/atlas/pull/29)).

### Fixed
- Restored the back button on the record detail page
  ([JPL-Devin/atlas#34](https://github.com/JPL-Devin/atlas/pull/34)).
- "Search Error" when sorting by File Name or other text fields
  ([JPL-Devin/atlas#51](https://github.com/JPL-Devin/atlas/pull/51)).
- "Search Error" when running an Advanced Filters query; example queries updated to match the
  current index ([JPL-Devin/atlas#55](https://github.com/JPL-Devin/atlas/pull/55)).
- Image Search no longer reopens a stale `uri` query after visiting Archive Explorer or a record
  ([JPL-Devin/atlas#49](https://github.com/JPL-Devin/atlas/pull/49)).
- Missing filename details on deployed records
  ([JPL-Devin/atlas#26](https://github.com/JPL-Devin/atlas/pull/26)).
- Logo and font paths in development mode; SonarQube new-code issues.
- `npm run test:unit` crashing with "exports is not defined in ES module scope"
  ([JPL-Devin/atlas#57](https://github.com/JPL-Devin/atlas/pull/57)).

### Maintenance
- Dependabot: browserslist, postcss-selector-parser, react-router-dom, svgo, colord, joi, js-yaml.

## 2026-08

### Added
- Record detail Overview redesign, configured per mission: filename
  breakdown with SIS-sourced segment explanations, at-a-glance tiles, timestamp timeline,
  Files cards, General Fields, Related Resources (SIS documents) and a rebuilt ML
  Classification panel ([JPL-Devin/atlas#21](https://github.com/JPL-Devin/atlas/pull/21)).
- Filename grammars for MSL, MER, InSight, Phoenix, Pathfinder, MRO, MESSENGER, MGS MOC,
  Cassini ISS, Odyssey THEMIS, Clementine, M3, JunoCam, LCROSS, Galileo SSI, LRO LAMP and
  Lunar Orbiter.
- SIS registry linking SIS documents from filename details, Product Label and Archive Explorer.

### Changed
- Removed the left icon rail; filters are a sidebar (sheet on phones), the map is a results view
  with an optional split, and phones get a bottom navigation bar
  ([JPL-Devin/atlas#22](https://github.com/JPL-Devin/atlas/pull/22)).
- Archive Explorer preview panel restyled to match the record Overview.
- OpenSeadragon viewer allows deeper zoom in smaller steps and renders without smoothing.

### Maintenance
- Merged upstream `develop` into `develop-raws`
  ([NASA-PDS/atlas#366](https://github.com/NASA-PDS/atlas/pull/366),
  [NASA-PDS/atlas#361](https://github.com/NASA-PDS/atlas/pull/361)).
- Dependabot: GitHub Actions (checkout, setup-node, upload-artifact), postcss, postcss-preset-env,
  eslint-plugin-react-hooks, brace-expansion, fast-uri.

## 2026-07

### Fixed
- Archive Explorer performance degradation for missions with many volumes (e.g. MRO)
  ([JPL-Devin/atlas#13](https://github.com/JPL-Devin/atlas/pull/13),
  [NASA-PDS/atlas#321](https://github.com/NASA-PDS/atlas/pull/321)).
- Stuck loading spinner and duplicate search cycles on short result sets
  ([JPL-Devin/atlas#17](https://github.com/JPL-Devin/atlas/pull/17),
  [NASA-PDS/atlas#320](https://github.com/NASA-PDS/atlas/pull/320)).

### Maintenance
- Removed dead jest-era test files
  ([JPL-Devin/atlas#16](https://github.com/JPL-Devin/atlas/pull/16),
  [NASA-PDS/atlas#319](https://github.com/NASA-PDS/atlas/pull/319)).
- Dependabot: webpack-dev-server, websocket-driver, svgo, @babel/core, http-proxy-middleware,
  launch-editor, form-data (reverted).

## 2026-06

### Maintenance
- Dependabot: react-router, react-router-dom.

## 2026-05

### Fixed
- Cancelling a download aborts in-flight requests (CSV/CURL/TXT/WGET/ZipStream)
  ([JPL-Devin/atlas#11](https://github.com/JPL-Devin/atlas/pull/11),
  [NASA-PDS/atlas#302](https://github.com/NASA-PDS/atlas/pull/302)).
- Bundle deep-link column index after the instrument column removal
  ([JPL-Devin/atlas#9](https://github.com/JPL-Devin/atlas/pull/9),
  [NASA-PDS/atlas#301](https://github.com/NASA-PDS/atlas/pull/301)).

### Security
- Removed `react-dev-utils`, bumped major dependencies and dropped `--openssl-legacy-provider`
  ([JPL-Devin/atlas#8](https://github.com/JPL-Devin/atlas/pull/8),
  [NASA-PDS/atlas#292](https://github.com/NASA-PDS/atlas/pull/292)).

### Maintenance
- Playwright end-to-end test infrastructure (Chromium suite + Firefox smoke)
  ([JPL-Devin/atlas#6](https://github.com/JPL-Devin/atlas/pull/6),
  [NASA-PDS/atlas#290](https://github.com/NASA-PDS/atlas/pull/290)).
- Dependabot: axios, ajv, fast-uri, qs, express, svgo, postcss, lodash, follow-redirects and others.

## 2026-04

### Added
- Machine-learning facets promoted to first-class filters
  ([NASA-PDS/atlas#237](https://github.com/NASA-PDS/atlas/pull/237)).
- Add Filter modal abstracts away raw `gather.*` field paths
  ([NASA-PDS/atlas#239](https://github.com/NASA-PDS/atlas/pull/239)).
- Record page loading spinner; in-flight thumbnail requests are cancelled when results change
  ([JPL-Devin/atlas#2](https://github.com/JPL-Devin/atlas/pull/2),
  [NASA-PDS/atlas#262](https://github.com/NASA-PDS/atlas/pull/262)).

### Security
- Fixed path injection findings (S2083, S6549) and renamed the `Documenation` directory to
  `Documentation` ([JPL-Devin/atlas#4](https://github.com/JPL-Devin/atlas/pull/4),
  [NASA-PDS/atlas#265](https://github.com/NASA-PDS/atlas/pull/265)).

### Fixed
- Development mode: ESLint errors no longer block the webpack dev server
  ([NASA-PDS/atlas#276](https://github.com/NASA-PDS/atlas/pull/276)).

### Maintenance
- Dependabot: react-markdown, styled-components, axios, lodash, babel-loader, postcss-loader,
  terser-webpack-plugin, eslint-webpack-plugin and others.

## 2026-03

### Added
- Archive Explorer: add entire bundles/volumes to the cart
  ([NASA-PDS/atlas#214](https://github.com/NASA-PDS/atlas/pull/214)).
- Archive Explorer: support for the `deprecated` folder
  ([NASA-PDS/atlas#210](https://github.com/NASA-PDS/atlas/pull/210)).

### Maintenance
- `packageManager` field in `package.json`; Dependabot configuration fixes
  ([NASA-PDS/atlas#222](https://github.com/NASA-PDS/atlas/pull/222),
  [NASA-PDS/atlas#220](https://github.com/NASA-PDS/atlas/pull/220),
  [NASA-PDS/atlas#221](https://github.com/NASA-PDS/atlas/pull/221)).

## 2026-02

### Changed
- Download type selection UX redesigned
  ([NASA-PDS/atlas#196](https://github.com/NASA-PDS/atlas/pull/196)).
- Removed the Instrument column from Archive Explorer
  ([NASA-PDS/atlas#195](https://github.com/NASA-PDS/atlas/pull/195)).

### Fixed
- ZIP downloads on Firefox ([NASA-PDS/atlas#190](https://github.com/NASA-PDS/atlas/pull/190)).
- Archive Explorer file paths no longer have the PDS standard appended
  ([NASA-PDS/atlas#203](https://github.com/NASA-PDS/atlas/pull/203)).

### Maintenance
- README live link, issue templates
  ([NASA-PDS/atlas#200](https://github.com/NASA-PDS/atlas/pull/200),
  [NASA-PDS/atlas#199](https://github.com/NASA-PDS/atlas/pull/199)).

## 2026-01

### Added
- Apollo mission display names ([NASA-PDS/atlas#193](https://github.com/NASA-PDS/atlas/pull/193)).

### Changed
- Atlas no longer relies on build-time paths; `PUBLIC_URL` is applied at runtime
  ([NASA-PDS/atlas#184](https://github.com/NASA-PDS/atlas/pull/184)).
- Generated download scripts honor the requester's operating system
  ([NASA-PDS/atlas#188](https://github.com/NASA-PDS/atlas/pull/188)).

### Maintenance
- Replaced the Makefile with `Taskfile.yml`
  ([NASA-PDS/atlas#183](https://github.com/NASA-PDS/atlas/pull/183)); updated Docker base image,
  `branch-cicd` workflow and secrets baseline
  ([NASA-PDS/atlas#176](https://github.com/NASA-PDS/atlas/pull/176),
  [NASA-PDS/atlas#177](https://github.com/NASA-PDS/atlas/pull/177),
  [NASA-PDS/atlas#179](https://github.com/NASA-PDS/atlas/pull/179)).
- Dependabot: GitHub Actions (checkout, setup-node, upload-artifact, codeql-action).

## 2025-12

### Maintenance
- Updated `jest` and related dependencies
  ([NASA-PDS/atlas#157](https://github.com/NASA-PDS/atlas/pull/157)); Dependabot: glob, node-forge.

## 2025-11

### Changed
- Removed BETA UI elements ([NASA-PDS/atlas#155](https://github.com/NASA-PDS/atlas/pull/155)).

### Fixed
- Table view header alignment ([NASA-PDS/atlas#137](https://github.com/NASA-PDS/atlas/pull/137)).

### Maintenance
- Dependency updates ([NASA-PDS/atlas#140](https://github.com/NASA-PDS/atlas/pull/140),
  [NASA-PDS/atlas#148](https://github.com/NASA-PDS/atlas/pull/148)); `.nvmrc` for the
  documentation site ([NASA-PDS/atlas#147](https://github.com/NASA-PDS/atlas/pull/147));
  Docusaurus URLs.

## 2025-10

### Added
- Bulk download size warning ([NASA-PDS/atlas#139](https://github.com/NASA-PDS/atlas/pull/139)).
- 3D models in Grid view show their texture image
  ([NASA-PDS/atlas#134](https://github.com/NASA-PDS/atlas/pull/134)).

### Changed
- Archive Explorer Missions column sorted alphabetically
  ([NASA-PDS/atlas#127](https://github.com/NASA-PDS/atlas/pull/127)).
- Updated ordering of filters in the Add Filter modal
  ([NASA-PDS/atlas#128](https://github.com/NASA-PDS/atlas/pull/128)).
- Results always fall back to sorting by `uri` for a stable order
  ([NASA-PDS/atlas#125](https://github.com/NASA-PDS/atlas/pull/125)).

### Fixed
- Page titles update when navigating
  ([NASA-PDS/atlas#133](https://github.com/NASA-PDS/atlas/pull/133)).
- List/Table views pull the right fields
  ([NASA-PDS/atlas#130](https://github.com/NASA-PDS/atlas/pull/130)).

## 2025-08

### Fixed
- Time filters included in deep links
  ([NASA-PDS/atlas#91](https://github.com/NASA-PDS/atlas/pull/91)).

## 2025-07

### Added
- Search within facets ([NASA-PDS/atlas#89](https://github.com/NASA-PDS/atlas/pull/89)).
- Archive Explorer differentiates PDS3 from PDS4
  ([NASA-PDS/atlas#87](https://github.com/NASA-PDS/atlas/pull/87)).
- Mariner and KPLO mission display names
  ([NASA-PDS/atlas#86](https://github.com/NASA-PDS/atlas/pull/86)).

### Maintenance
- Webpack-related dependency updates
  ([NASA-PDS/atlas#90](https://github.com/NASA-PDS/atlas/pull/90)).

## 2025-06

### Changed
- Bundle aggregation size increased to 10k
  ([NASA-PDS/atlas#82](https://github.com/NASA-PDS/atlas/pull/82)).

## 2025-05

### Changed
- Updated Atlas navigation ([NASA-PDS/atlas#70](https://github.com/NASA-PDS/atlas/pull/70)).
- Values within each filter are ORed together
  ([NASA-PDS/atlas#72](https://github.com/NASA-PDS/atlas/pull/72)).
- Advanced Query autocomplete uses Ctrl+Shift
  ([NASA-PDS/atlas#76](https://github.com/NASA-PDS/atlas/pull/76)).

### Fixed
- Product Label page crashing when a record has no browse image.

## 2025-04

### Added
- Standalone Atlas IV deployment ([NASA-PDS/atlas#61](https://github.com/NASA-PDS/atlas/pull/61)).

### Changed
- Improved usability around triggering bulk downloads
  ([NASA-PDS/atlas#68](https://github.com/NASA-PDS/atlas/pull/68)).

### Fixed
- Adding checked results to the cart
  ([NASA-PDS/atlas#67](https://github.com/NASA-PDS/atlas/pull/67)).

## 2025-01

### Added
- User-friendly mission and product type names in Archive Explorer and filters
  ([NASA-PDS/atlas#58](https://github.com/NASA-PDS/atlas/pull/58)).

### Changed
- Uses the `pds-imaging` API domain name.

## 2024-12

### Added
- `jpeg` recognized as an image extension.

### Fixed
- Facet fields reordering when adding new filters.

## 2024-11

### Changed
- "Add query to cart" is easier to find on Search
  ([NASA-PDS/atlas#56](https://github.com/NASA-PDS/atlas/pull/56)).

## 2024-10

### Changed
- Uses `pdsimg` endpoints ([NASA-PDS/atlas#53](https://github.com/NASA-PDS/atlas/pull/53)).
- Documentation link points at `/beta/atlas/documentation`.

## 2024-09

### Fixed
- Archive Explorer Preview no longer stops querying browses after one fails.

## 2024-08

### Fixed
- Archive Explorer Preview lowercases file extensions.

## 2024-04

### Changed
- Friendlier handling of missing browse images; they no longer break ZIP downloads
  ([NASA-PDS/atlas#29](https://github.com/NASA-PDS/atlas/pull/29)).

### Fixed
- Archive Explorer: older versions are not shown as related, deep-link fixes and wider columns
  ([NASA-PDS/atlas#35](https://github.com/NASA-PDS/atlas/pull/35)).

### Maintenance
- Roundup Action for CI and secrets detection
  ([NASA-PDS/atlas#37](https://github.com/NASA-PDS/atlas/pull/37)); Dependabot groups
  ([NASA-PDS/atlas#36](https://github.com/NASA-PDS/atlas/pull/36)).

## 2024-03

### Added
- CSV and TXT downloads; progress indicators for all downloads
  ([NASA-PDS/atlas#24](https://github.com/NASA-PDS/atlas/pull/24)).
- Product type in search columns and default filters.

### Changed
- Improved text search, regex and deep links
  ([NASA-PDS/atlas#27](https://github.com/NASA-PDS/atlas/pull/27)).

### Fixed
- WGET/CURL folder downloads and the scroll API
  ([NASA-PDS/atlas#24](https://github.com/NASA-PDS/atlas/pull/24)).
- `release_id` included in downloader queries; Docker build out-of-memory errors.

## 2024-02

### Fixed
- Node `lts/iron` support ([NASA-PDS/atlas#20](https://github.com/NASA-PDS/atlas/pull/20)).
- Extension parsing for floating-point `release_id` URIs.

## 2024-01

### Changed
- `release_id` stored as a float field (`release_id_num`)
  ([NASA-PDS/atlas#18](https://github.com/NASA-PDS/atlas/pull/18)).

### Fixed
- Archive Explorer quick download path.

## 2023-12

### Added
- Folder downloads include the `release_id`
  ([NASA-PDS/atlas#13](https://github.com/NASA-PDS/atlas/pull/13)).

### Maintenance
- CODEOWNERS, README and pull request template.

## 2023-11 — Open Source Release

- Initial open-source release of Atlas IV, with CI workflows and supporting documents.
