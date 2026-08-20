# Record Detail Redesign (Mockup 1) — Implementation Assessment

Technical assessment of whether the "Overview redesign" direction
(`mockup/src/01-overview-redesign.html`) can be built against Atlas's real
data, plus a proposed configuration design.

**This is an assessment, not an implementation.** No production code is
changed by this document.

---

## 0. Verdict

Mockup 1 is implementable, but **not as a single layout driven by one set of
fields.** The evidence below shows three things that shape the whole design:

1. **There is no universal at-a-glance vocabulary — and no universal field at
   all** beyond `mission`, `spacecraft`, `instrument`, `target`,
   `product_type`, `file_name`, `pds_standard` and the label URI. Even
   `gather.time.start_time`, which Atlas uses as its default sort field, is
   absent for 100% of MGS, Magellan and Lunar Orbiter products and 99.8% of
   Clementine products.
2. **The correct configuration axis is not `mission → instrument → processing
   level`.** It must be `mission → pds_standard → instrument → product_type`.
   `pds_standard` matters more than instrument: the *same instrument on the
   same spacecraft* has a completely different normalized field set depending
   on whether the product was archived as PDS3 or PDS4 (§3.3). And
   `processing_level` cannot be a resolution key at all, because it only
   exists inside the raw PDS4 label (6.2% of the index) and has no PDS3
   equivalent (§3.4).
3. **The prose templates cannot read only from `gather`.** For several
   missions the fields the design wants are present in the archive but were
   never normalized — they exist only in `pds3_label` / `pds4_label`. Config
   therefore needs per-field *fallback chains*, not single paths (§4).

The recommendation is a resolved-string API contract (§8), which also happens
to fix an existing payload problem: `/record` today downloads the entire
`_source` to the browser — up to 60 KB per record, 93% of which is raw label
the Overview never uses (§8.1).

---

## 1. Method

All numbers below come from the live index Atlas itself consumes, queried
read-only during this assessment:

| Purpose | Endpoint |
|---|---|
| Authoritative field list | `https://pds-imaging.jpl.nasa.gov/api/search/atlas/_mapping` |
| Presence / aggregation / samples | `https://pds-imaging.jpl.nasa.gov/api/search/atlas/_search` |
| Asset byte verification | `https://pds-imaging.jpl.nasa.gov/api/data/<uri>::<release_id>` |

Approach:

1. Pulled `_mapping` and flattened it to leaf fields — the authoritative list,
   rather than inferring from samples.
2. Built presence percentages with `exists` filters nested under
   `terms(gather.common.mission)`, per mission and per
   mission × instrument population.
3. Pulled full `_source` documents for representative products per
   mission/instrument, including the specific MGS product named in the task.
4. Separately scanned numeric fields for PDS3 sentinel values (`±1e30`),
   because "field exists" and "field has a usable value" are not the same
   thing (§5.2).
5. `track_total_hits: true` on every counting query. (An early pass without it
   reported a flat 10,000 for every population — those numbers were discarded
   and are not used here.)

---

## 2. Shape of the index

| Measure | Value |
|---|---|
| Total documents | 239,665,253 |
| Documents with `gather.common.mission` (i.e. real products) | 60,183,082 |
| Leaf fields in `_mapping` | 2,607 |
| — `gather.*` (normalized) | 149 |
| — `pds3_label.*` (raw) | 1,550 |
| — `pds4_label.*` (raw) | 877 |
| — `archive.*` | 22 |
| Distinct missions | 21 |
| Distinct instruments | 91 |
| Distinct product types | 178 |
| Distinct mission × instrument pairs | 94 |
| Distinct mission × instrument × product_type triples | 882 |

The ~180M documents without a mission are individual archive file entries
(labels, browse siblings, ancillary files) rather than products, so the
addressable population for `/record` is ~60M.

**Config authoring is finite and tractable.** Coverage by number of
mission × instrument × product_type triples configured:

| Triples configured | Share of products covered |
|---|---|
| 5 | 40.2% |
| 10 | 47.2% |
| 25 | 59.5% |
| 50 | 71.7% |
| 100 | 83.2% |
| 200 | 92.2% |
| 882 (all) | 100% |

So a generic fallback plus ~25 hand-authored configs covers 60% of products,
and ~100 covers 83%. This is the single most important planning number in
this document: the config surface is tens of entries, not hundreds, and the
fallback layer carries the long tail.

Products by mission:

| Mission | Products | Mission | Products |
|---|---:|---|---:|
| `msl` | 26,990,662 | `mgs` | 243,227 |
| `mars_2020` | 14,430,266 | `lcro` | 113,044 |
| `mer` | 7,049,275 | `lro` | 77,205 |
| `ody` | 2,797,610 | `mgn` | 72,818 |
| `mro` | 2,725,454 | `vik` | 64,514 |
| `clem` | 1,914,652 | `juno` | 39,744 |
| `mess` | 1,306,220 | `go` | 20,122 |
| `cas` | 916,485 | `mpf` | 17,712 |
| `vgr` | 577,401 | `ch1` | 12,152 |
| `nsyt` | 314,142 | `lo` | 2,990 |
| `phx` | 256,433 | | |

---

## 3. Field-by-field availability for mockup 1

### 3.1 What mockup 1 actually asks for

Extracted from `mockup/src/01-overview-redesign.html`. The description
paragraph and the viewer caption between them reference:

> Sol · mission name · calendar date · LTST · instrument display name ·
> spacecraft display name · target · Site · Drive · instrument azimuth ·
> instrument elevation · solar elevation · solar azimuth · Ls ·
> product/processing description ("Calibrated color (CWG)") · sequence ·
> bundle · release · file count

Plus the at-a-glance tiles and the browse image.

### 3.2 Availability legend

- **U** — universal (≥99% of all products)
- **M** — mission-specific (present for some missions, absent for others)
- **I** — instrument-specific (varies *within* a mission)
- **S** — standard-specific (varies by `pds_standard` within the same instrument)
- **L** — exists only in the raw label, not normalized
- **D** — must be derived/computed
- **X** — not in the index at all

### 3.3 Availability table

Percentages are of products in that population. `.` means 0%.

| Mockup 1 field | Normalized path | Class | Evidence |
|---|---|---|---|
| Mission | `gather.common.mission` | **U** | 100% everywhere |
| Spacecraft | `gather.common.spacecraft` | **U** | 100% everywhere |
| Instrument (id) | `gather.common.instrument` | **U** | 100% everywhere. *Multi-valued on PDS4* — e.g. `["MCZ_RIGHT","MCAMZ_BOTH"]` |
| Target | `gather.common.target` | **U** | 100% (96% `go`) |
| Product type (code) | `gather.common.product_type` | **U** | 100% (50% `mess`) |
| File name | `gather.pds_archive.file_name` | **U** | 100% everywhere |
| Label URI | `gather.pds_archive.related.label.uri` | **U** | 100% everywhere |
| PDS standard | `gather.pds_archive.pds_standard` | **U** | 100% everywhere |
| Browse image URI | `...related.browse.uri` | **M** | 99.4% of products. 384,358 have none — see §6.1 |
| **Start time** | `gather.time.start_time` | **M** | `mars_2020`/`mer`/`ody`/`nsyt`/`phx`/`lro`/`lcro`/`juno`/`vik` 100%; `cas` 99.1%; `msl` 91.9%; `mro` 83.9%; `vgr` 84.9%; `go` 17.7%; `mpf` 0.9%; `clem` 0.2%; **`mgs` / `mgn` / `lo` 0.0%** |
| Instrument display name | `gather.common.instrument_name` | **M,S** | 14.3% index-wide. `mer`/`mgs`/`phx`/`cas`/`juno`/`go`/`clem` 100%; **all of `mars_2020` 0%**; `msl` 38% (PDS3 only) |
| Product type display name | `gather.common.product_type_name` | **M,S** | 14.2% index-wide. `mer` 100%, `ody` 100%; `mars_2020` 0%; `msl` 38% |
| Sol / planet day | `gather.landed_missions.planet_day_number` | **M,S** | `mer`/`phx` 100%, `mars_2020` 99.2%, `nsyt` 99.6%, **`msl` 77.2%**, `mpf` 0%; all orbiters 0% |
| **LTST** | `gather.landed_missions.start_local_true_solar_time` | **M,S** | **only `mars_2020` 98.4% and `nsyt` 99.3%.** `msl` 0%, `mer` 0%, `phx` 0% — see §3.4 |
| LMST | `...start_local_mean_solar_time` | **M,S** | same distribution as LTST |
| Site | `gather.landed_missions.rmc_site` | **M,S** | `mer` 100%, `mars_2020` 99%, `nsyt`/`phx` 100%, `msl` 38% |
| Drive | `gather.landed_missions.rmc_drive` | **M,S** | `mer` 100%, `mars_2020` 98%, `msl` 38% |
| Instrument az/el | `gather.landed_missions.site_instrument_azimuth` / `_elevation` | **M,I** | `mars_2020` 94% (MCZ 99%, NAVCAM 100%, **HELI_NAV 14%**), `nsyt` 99%, `phx` 92%, `mer` 11% |
| Solar az/el (surface) | `gather.landed_missions.site_solar_azimuth` / `_elevation` | **M,I** | `mars_2020` 94%, `phx` 100%, `mer` 12% |
| Ls (solar longitude) | `gather.lighting_geometry.solar_longitude` | **M,I** | `mars_2020` 66% (NAVCAM only 53%), `mer` 100%, `mro` 88–100%, `msl` 38%, `nsyt` 12% |
| **Sequence** | — | **L** | Not in `gather` at all. `pds4_label.msn_surface:Command_Execution/msn_surface:sequence_id` (`mars_2020` 95%, `msl` 16.9%, everything else 0%); `pds3_label.sequenceId` 11.9% index-wide |
| Bundle | `gather.pds_archive.bundle_id` | **S** | PDS4 only. `mars_2020` 100%, `msl` 62%, `nsyt` 100%, `vik` 90%, `vgr` 5.3%; all PDS3-only missions 0% (they have `data_set_id` / `volume_id` instead) |
| Release | `gather.pds_archive.release_id` | **M** | `mars_2020` 77%, `nsyt` 100%, `msl` 62%; PDS3 missions 0% in `gather` (top-level `release_id` still present) |
| Processing level | — | **L,S** | `pds4_label.pds:Primary_Result_Summary/pds:processing_level` 6.2% index-wide (PDS4 only); `pds3_label.Processing_Level_Id` 0.02%. Values seen: `Calibrated`, `Derived`, `Partially Processed` |
| Colour / filter | `gather.ancillary.color_filter` | **M** | `mars_2020` 97%; 0% elsewhere. `gather.common.filter` covers `mer` 98%, `mgs` 100%, `mro` 81% |
| Orbit number | `gather.orbital_missions.orbit` | **M** | `mgs`/`ody`/`mro`/`ch1` 100%, `vik` 80%, `mess` 36%, `go` 46%; all rovers 0% |
| Incidence / emission / phase | `gather.lighting_geometry.*` | **M** | `mro` 99.7%, `clem` 99.3%, `cas` 99.6%, `go` 68%, `mess` 49.8%, `lo` 100%; **`mgs` 0.0%** (label only) |
| Spacecraft altitude | `gather.orbital_missions.spacecraft_altitude` | **M** | `mro`/`clem`/`juno`/`lo` ~100%, `mess` 49.8%, **`mgs` 0.0%** (label only) |
| Sub-spacecraft lat/lon | `gather.orbital_missions.sub_spacecraft_*` | **M** | `mro`/`cas`/`clem` 100%, `mess` 99%, **`mgs` 0.0%** (label only) |
| Geo footprint / location | `gather.common.geo_footprint` / `geo_location` | **M** | footprint: `ody` 94%, `clem` 94%, `mgn` 99%, `mgs` 72%, `mro` 19%; 0% for all rovers |
| Asset size | `archive.size` | **U** | 98.4% index-wide |
| **File / related-product count** | — | **D** | Derivable from `gather.ancillary.group_id`, but that field is `mars_2020`-only (97.2%; 0% for every other mission) — see §6.2 |
| **Citation / DOI** | — | **X** | `pds4_label.pds:Citation_Information/pds:doi` exists in the mapping but is populated on **1 document out of 239M**. Citations must be composed, not read |
| **Prose description** | — | **X / partial** | No description field exists for the vast majority. `pds3_label.description` and `RATIONALE_DESC` exist for ~1–2% — see §6.4 |

### 3.4 The finding that most affects the design: `pds_standard` outranks instrument

Two real products, **same mission, same instrument, same spacecraft**:

**A — MSL Mastcam Left, PDS4**
`atlas:pds4:msl:curiosity:/deen_pdart16_msl_msam/data/sol/00137/opgs/rdr/mcam/MLF_409663942ILT_S0051858AUT_04096D1.IMG`

```
gather.common       → instrument, target, spacecraft, product_type, mission, kind
gather.pds_archive  → bundle_id, collection_id, product_id, file_name, browse, label
gather.time         → start_time, stop_time, product_creation_time, sclk
gather.landed_missions      → ABSENT ENTIRELY
gather.lighting_geometry    → ABSENT ENTIRELY
```

**B — MSL Mastcam Left, PDS3**
`atlas:pds3:msl:curiosity:/MSLMST_0010/DATA/RDR/SURFACE/0964/0964ML0042730150403956I01_DRCL.IMG`

```
gather.landed_missions   → planet_day_number 964, rmc_site 47, rmc_drive 0, rmc_rsm 78, image_type
gather.lighting_geometry → solar_longitude 330.834
gather.common            → instrument_name "MASTCAM", product_type_name "RDR", mission_phase_name
gather.time              → ABSENT ENTIRELY (no start_time)
```

Product A has time but no sol/site/drive/Ls. Product B has sol/site/drive/Ls
but no time. **Neither has LTST normalized.** A mockup-1 at-a-glance block
keyed on `msl/MAST_LEFT` alone would be half-empty for whichever half of the
population it wasn't authored against.

Crucially, **product A's label has everything the design wants**:

```
msn:Surface_Mission/msn:start_sol_number              = "0137"
pds:Time_Coordinates/pds:local_true_solar_time        = "15:22:53"
pds:Time_Coordinates/pds:local_mean_solar_time        = "14:58:29.878"
msn:Surface_Mission/msn:solar_longitude               = "231.811"
geom:Derived_Geometry/geom:solar_azimuth              = "248.4429"
geom:Derived_Geometry/geom:solar_elevation            = "38.7834"
geom:Motion_Counter_Index/geom:index_id               = ["SITE","DRIVE","POSE",...]
geom:Motion_Counter_Index/geom:index_value_number     = ["5","1858","6",...]
pds:Primary_Result_Summary/pds:processing_level        = "Partially Processed"
```

So this is a **normalization gap, not a data gap**. Index-wide the PDS4
label paths are populated at 6.1–6.2% (≈14.7–14.9M documents) — which is
essentially *all* PDS4 products. Two consequences:

- Config must support **fallback chains** per field: prefer `gather`, fall
  back to a named label path (§4.2).
- The cleanest long-term fix is a normalization pass that populates
  `gather.landed_missions` / `gather.lighting_geometry` for PDS4 surface
  products. That is a backend/indexing change outside this repo, and the
  fallback chains are what make the redesign shippable without waiting for it.

Note also the RMC shape difference: PDS3 gives `rmc_site` / `rmc_drive` as
discrete normalized fields; PDS4 gives two parallel arrays
(`index_id[]` / `index_value_number[]`) that must be zipped by name. A
fallback chain that just reads a path is insufficient here — this needs a
named **extractor** (§4.3).

---

## 4. Proposed configuration design

### 4.1 Where config lives and who owns it

**Recommendation: versioned JSON in this repo, consumed by the API layer, not
the browser.**

```
config/record-detail/
├── schema/
│   ├── profile.schema.json          # JSON Schema for a profile
│   └── template.schema.json
├── formatters.js                    # named, allowlisted value formatters
├── extractors.js                    # named derived-value extractors
├── _default.json                    # generic fallback profile
├── mission/
│   ├── mars_2020.json
│   ├── mars_2020.pds4.NAVCAM_RIGHT.json
│   ├── mgs.json
│   ├── mgs.pds3.MOC.json
│   └── ...
└── templates/
    ├── _default.md
    ├── mars_2020.pds4.ncam.md
    └── mgs.pds3.moc.md
```

Rationale:

- **Not a database.** Atlas has no database (`AGENTS.md`), and adding one for
  ~100 config files would be the largest single cost in this project for no
  benefit. Config changes are reviewable, diffable, revertable, and roll out
  with a deploy.
- **Not an admin UI in Atlas.** An authoring surface is the thing the task
  explicitly forbids exposing. Mockup 3 ("Template studio") is a useful
  *internal* mental model, but building it as a service is a separate project.
  If mission data engineers want a preview tool, the cheap version is a CLI
  (`npm run record-preview -- <uri>`) that prints the resolved output for a
  real product — same code path as production, no new attack surface.
- **Owner: mission data engineers**, via normal PR review. The JSON Schema plus
  §7 validation is what lets a non-frontend engineer edit safely.

The one caveat: if resolution moves into the API Lambda (§8), this config has
to be *deployed with* that Lambda, which lives outside this repo. The practical
answer is to publish `config/record-detail/` as a small versioned package (or
build artifact) that both the API and the preview CLI consume, so there is a
single source of truth and the repo stays the editing surface.

### 4.2 Resolution order

```
_default
  → mission/<mission>.json
    → mission/<mission>.<pds_standard>.json
      → mission/<mission>.<pds_standard>.<instrument>.json
        → mission/<mission>.<pds_standard>.<instrument>.<product_type>.json
```

Deviation from the `mission → instrument → processing level` order in the
task, and why:

- **`pds_standard` is inserted second**, above instrument, because §3.4 shows
  it is the strongest predictor of which normalized fields exist. It is also
  100% populated, so it is always available as a key.
- **`processing_level` is replaced by `product_type`.** `processing_level`
  only exists inside the PDS4 label (6.2% of the index, zero PDS3 coverage),
  so keying on it would make 94% of products unkeyable. `product_type` is
  ~100% populated, is already an Atlas facet, and in practice *encodes* the
  processing level (M2020 `EDR` vs `TDR` vs `RNR`, MSL `ILT` vs `RDR`).
  `processing_level` remains available as a *display* value where present.

Merge semantics:

- Scalars (`title`, `template`, `emptyState`) — child replaces parent.
- `tiles` — keyed by tile `id`; child entries replace same-`id` parents,
  new ids append. Ordering by explicit `order` integer, so a child can
  reposition an inherited tile without redeclaring it.
- `tiles: { "<id>": null }` — explicit suppression of an inherited tile.
- No deep array concatenation anywhere: it is the least predictable merge rule
  to reason about when four layers stack.

**Multi-valued instrument.** `gather.common.instrument` is an array on PDS4
(`["MCZ_RIGHT","MCAMZ_BOTH"]`). Resolution must pick deterministically:
try each value against the config set in array order and take the first that
matches a profile; if none match, fall back to the `<mission>.<standard>`
layer. This must be specified, not left to `Array.find` incidentally.

### 4.3 Profile schema

```jsonc
{
  "$schema": "../schema/profile.schema.json",
  "extends": "mars_2020.pds4",
  "match": { "mission": "mars_2020", "pds_standard": "pds4", "instrument": "NAVCAM_RIGHT" },

  "template": "templates/mars_2020.pds4.ncam.md",

  "tiles": {
    "sol": {
      "order": 10,
      "label": "Sol",
      "source": [
        { "path": "gather.landed_missions.planet_day_number" },
        { "path": "pds4_label.msn:Surface_Mission/msn:start_sol_number" }
      ],
      "format": "integer"
    },
    "ltst": {
      "order": 20,
      "label": "Local true solar time",
      "source": [
        { "path": "gather.landed_missions.start_local_true_solar_time" },
        { "path": "pds4_label.pds:Time_Coordinates/pds:local_true_solar_time" }
      ],
      "format": "clock_hm"
    },
    "rmc": {
      "order": 30,
      "label": "Rover motion",
      "source": [
        { "extractor": "rmc", "args": { "indices": ["SITE", "DRIVE"] } }
      ],
      "format": "text"
    },
    "instrument_pointing": {
      "order": 40,
      "label": "Camera pointing",
      "source": [{ "extractor": "az_el_pair",
                   "args": { "az": "gather.landed_missions.site_instrument_azimuth",
                             "el": "gather.landed_missions.site_instrument_elevation" } }],
      "format": "degrees",
      "precision": 1
    },
    "solar_elevation": {
      "order": 50,
      "label": "Sun elevation",
      "source": [{ "path": "gather.landed_missions.site_solar_elevation" }],
      "format": "degrees",
      "precision": 1
    },
    "ls": {
      "order": 60,
      "label": "Solar longitude (Ls)",
      "source": [
        { "path": "gather.lighting_geometry.solar_longitude" },
        { "path": "pds4_label.msn:Surface_Mission/msn:solar_longitude" }
      ],
      "format": "degrees",
      "precision": 1
    },
    "product_type": {
      "order": 70,
      "label": "Product",
      "source": [
        { "path": "gather.common.product_type_name" },
        { "path": "pds4_label.msn:Mission_Information/msn:product_type_name" },
        { "path": "gather.common.product_type" }
      ],
      "format": "product_type_label"
    },
    "sequence": {
      "order": 80,
      "label": "Sequence",
      "source": [{ "path": "pds4_label.msn_surface:Command_Execution/msn_surface:sequence_id" }],
      "format": "upper"
    }
  },

  "maxTiles": 8,
  "emptyState": "no_browse_generic"
}
```

Notes on the shape:

- **`source` is always an ordered array of candidates.** First candidate that
  yields a *valid* value wins (§5). This is what absorbs the `gather` /
  label split without duplicating whole profiles.
- **`format` and `extractor` are names, not code.** They resolve against
  allowlists in `formatters.js` / `extractors.js`. No expressions, no `eval`,
  no arbitrary JS in config — config authored by mission engineers must not be
  able to execute anything.
- Label paths containing `:` and `/` (and, in PDS3, parentheses —
  `pds3_label.timestamp(imageTime)` is a real field name) are treated as
  **opaque single path segments** after the `pds3_label.` / `pds4_label.`
  prefix. Naive dot-splitting breaks on all of these.
- **`maxTiles`** caps what renders so an over-eager profile can't push the
  description below the fold.

### 4.4 Worked example — orbiter: `mgs.pds3.MOC`

Grounded in the real document the task named,
`atlas:pds3:mgs:mars_global_surveyor:/mgsc_1042/m04008/m0400821.imq`.

For this product `gather` contains only: mission, spacecraft, instrument,
`instrument_name` "MOC Narrow Angle", target, product_type `EDR`,
`mission_phase_name` "MAPPING", `filter` "N/A", `geo_location`,
`geo_footprint`, `orbital_missions.orbit` 1936, and archive identifiers.
**No `gather.time` at all**, and none of
`gather.lighting_geometry` / the rest of `gather.orbital_missions`.

Everything else the tiles need is in the 67-field `pds3_label`:

```jsonc
{
  "extends": "mgs.pds3",
  "match": { "mission": "mgs", "pds_standard": "pds3", "instrument": "MOC" },
  "template": "templates/mgs.pds3.moc.md",

  "tiles": {
    "orbit":      { "order": 10, "label": "Orbit",
                    "source": [{ "path": "gather.orbital_missions.orbit" },
                               { "path": "pds3_label.orbitNumber" }],
                    "format": "integer" },

    "image_time": { "order": 20, "label": "Image time",
                    "source": [{ "path": "gather.time.start_time" },
                               { "path": "pds3_label.timestamp(imageTime)" }],
                    "format": "utc_datetime" },

    "location":   { "order": 30, "label": "Centre lat / lon",
                    "source": [{ "extractor": "lat_lon",
                                 "args": { "path": "gather.common.geo_location" } },
                               { "extractor": "lat_lon_pair",
                                 "args": { "lat": "pds3_label.centerLatitude",
                                           "lon": "pds3_label.centerLongitude" } }],
                    "format": "lat_lon" },

    "lighting":   { "order": 40, "label": "Incidence / emission / phase",
                    "source": [{ "extractor": "angle_triple",
                                 "args": { "i": ["gather.lighting_geometry.incidence_angle",
                                                 "pds3_label.incidenceAngle"],
                                           "e": ["gather.lighting_geometry.emission_angle",
                                                 "pds3_label.emissionAngle"],
                                           "p": ["gather.lighting_geometry.phase_angle",
                                                 "pds3_label.phaseAngle"] } }],
                    "format": "degrees", "precision": 1 },

    "altitude":   { "order": 50, "label": "Spacecraft altitude",
                    "source": [{ "path": "gather.orbital_missions.spacecraft_altitude" },
                               { "path": "pds3_label.spacecraftAltitude" }],
                    "format": "distance_km", "precision": 0 },

    "resolution": { "order": 60, "label": "Scaled pixel width",
                    "source": [{ "path": "pds3_label.scaledPixelWidth" }],
                    "format": "distance_m", "precision": 2 },

    "phase":      { "order": 70, "label": "Mission phase",
                    "source": [{ "path": "gather.common.mission_phase_name" }],
                    "format": "title_case" },

    "sol":        null,   // suppress anything rover-shaped inherited upstream
    "ltst":       null,
    "rmc":        null
  },

  "maxTiles": 7,
  "emptyState": "no_browse_generic"
}
```

Note there is **zero overlap** between the MGS tile set and the M2020 tile
set. That is the design working as intended, and it is why a single global
field list cannot produce this page.

### 4.5 Templates: one source, five variants

One file per profile. Named blocks, each producing one variant, sharing the
same resolved value bag and the same conditional machinery:

```
{{! templates/mgs.pds3.moc.md }}

{{#block description}}
{{spacecraft_name}}'s {{instrument_name}} imaged {{target_name}}
{{#if location}}near {{location}}{{/if}}
{{#if orbit}}on orbit {{orbit}}{{/if}}
{{#if image_time}}({{image_time:date}}){{/if}}.
{{#if lighting}}The scene was lit at {{lighting.i}} incidence, viewed at
{{lighting.e}} emission, for a phase angle of {{lighting.p}}.{{/if}}
{{#if resolution}}Ground sample distance is about {{resolution}}.{{/if}}
{{#if label_description}}The label describes it as: {{label_description}}.{{/if}}
{{/block}}

{{#block caption}}
{{instrument_name}} — orbit {{orbit}}{{#if image_time}}, {{image_time:date}}{{/if}}
{{/block}}

{{#block short_caption}}
{{instrument_short}}{{#if orbit}} · orbit {{orbit}}{{/if}}
{{/block}}

{{#block alt_text}}
{{instrument_name}} image of {{target_name}}{{#if location}} at {{location}}{{/if}}
{{/block}}

{{#block citation}}
{{spacecraft_name}} {{instrument_name}}, {{product_id}}.
NASA Planetary Data System, {{data_set_id}}{{#if release}}, release {{release}}{{/if}}.
Retrieved from Atlas, {{retrieved_date}}.
{{/block}}
```

Design points:

- **Five blocks, one value bag.** Variants can never disagree about the facts,
  because they read the same resolved tiles. `alt_text` is deliberately the
  plainest block — it is the accessibility surface, not a place for
  degree symbols and parentheses.
- **`{{#if}}` guards every optional clause**, and the *punctuation lives
  inside the guard*. This is what prevents `Sol undefined` and, just as
  importantly, prevents `imaged Mars , .` — the failure mode that actually
  shows up in practice is orphaned punctuation, not orphaned tokens.
- **`{{token:format}}`** selects an alternate formatter for the same value
  (`image_time:date` → `1999-08-14`; bare `image_time` → full UTC timestamp).
- **`label_description`** exploits a real find: MOC labels carry
  human-written prose — this product's is *"Partial traverse of a surface
  covered in part by south polar frost"*. `pds3_label.description` /
  `RATIONALE_DESC` / `rationaleDesc` are populated on ~1–2% of the index
  (2.3–2.8M documents), so wherever it exists it should be surfaced verbatim
  rather than paraphrased by a template. It is the only genuinely
  human-authored description in the archive.
- **Templates are Markdown-ish but rendered to a constrained AST**, not to
  HTML. Output is text plus a small allowlist of link nodes (mission,
  instrument, target — the underlined links in the mockup). Never
  `dangerouslySetInnerHTML` over data derived from PDS labels.

### 4.6 The `_default` fallback

An unconfigured mission or a brand-new instrument must render something
sensible. `_default.json` uses only fields verified universal in §3.3:

| Tile | Source |
|---|---|
| Instrument | `gather.common.instrument_name` → `gather.common.instrument` |
| Target | `gather.common.target` |
| Product type | `gather.common.product_type_name` → `gather.common.product_type` |
| Time | `gather.time.start_time` → `gather.time.product_creation_time` |
| Archive | `bundle_id` → `data_set_id` → `volume_id` |
| Mission phase | `gather.common.mission_phase_name` |
| Size | `archive.size` |

With the default description template degrading to roughly:
*"{{spacecraft_name}} {{instrument_name}} product of {{target_name}}{{#if
time}}, {{time:date}}{{/if}}."*

This is intentionally close to what Atlas shows today, so the worst case for
an unconfigured product is "no better than the status quo", never "broken".

---

## 5. Missing values, sentinels, and null-ish data

"Field exists" is not "field is displayable". Four distinct failure classes
were observed, and resolution must handle all four before a value is accepted:

### 5.1 Absent path
Handled by the `source` chain; if every candidate misses, the tile is
**dropped**, and every template clause referencing it is skipped.

### 5.2 PDS3 numeric sentinels
Real, and concentrated in exactly the orbiter fields mockup 1 wants:

| Mission | Field | Present | Sentinel (±1e30) | % invalid |
|---|---:|---:|---:|---:|
| `cas` | `lighting_geometry.incidence_angle` | 912,846 | 608,611 | **66.7%** |
| `cas` | `lighting_geometry.emission_angle` | 912,846 | 608,611 | **66.7%** |
| `cas` | `lighting_geometry.phase_angle` | 912,846 | 215,261 | 23.6% |
| `cas` | `orbital_missions.target_distance` | 912,846 | 215,261 | 23.6% |
| `cas` | `orbital_missions.sub_spacecraft_latitude` | 912,753 | 215,297 | 23.6% |
| `clem` | `lighting_geometry.incidence_angle` | 1,900,481 | 96,531 | 5.1% |
| `clem` | `orbital_missions.solar_distance` | 1,900,481 | 88,004 | 4.6% |

A naive implementation renders **"1e+30° incidence"** on two thirds of
Cassini products. Sentinel rejection is not a nicety.

### 5.3 Explicit nulls
The MGS product carries `productType: null`, `localTime: null`,
`releaseId: null` — the key exists, the value is null. `exists` queries count
these as absent, but a client-side `path in doc` check would accept them.

### 5.4 Out-of-domain values
`gather.common.filter` = `"N/A"` (100% of MGS), `mean`/`standardDeviation`/
`minimumLatitude` = `0` as a not-computed marker, and
`gather.ancillary.special_processing_flag` = `"_"`.

**Proposed validity gate**, applied to every candidate before acceptance:

```jsonc
{
  "reject": {
    "null": true,
    "emptyString": true,
    "sentinelMagnitude": 1e29,          // rejects ±1e30 and friends
    "values": ["N/A", "NULL", "UNK", "UNKNOWN", "NONE", "_", "-"],
    "range": { "min": -360, "max": 360 } // per-format, from the formatter
  }
}
```

Defaults come from the named `format` (an angle formatter carries
`[-360, 360]`; a distance formatter rejects negatives), so profile authors get
correct behaviour without writing the gate. Per-tile `reject` overrides exist
for the exceptions.

---

## 6. Gaps: what is missing, and what it takes

### 6.1 Products with no browse image

384,358 products (0.64% of the addressable population) have no
`related.browse.uri`, entirely concentrated in five instruments:

| Mission | Instrument | Count |
|---|---|---:|
| `mess` | MDIS | 320,980 |
| `lcro` | NSP / VSP / TLP | 53,252 |
| `ch1` | M3 | 5,057 |
| `cas` | RADAR | 3,494 |
| `go` | NIMS | 1,575 |

These are mostly spectrometers and radar — not "missing" so much as *not
images*. The empty state should therefore be per-profile
(`emptyState: "spectrum_no_browse"` vs `"generic_no_browse"`) rather than one
generic "no preview available" box, and the at-a-glance block becomes the
primary content for these products rather than a sidebar.

**Correction to a stated premise.** The task cites MGS `M0400821.IMG` as
having no browse image. It does. The record is
`atlas:pds3:mgs:mars_global_surveyor:/mgsc_1042/m04008/m0400821.imq`, its
indexed browse URI is
`.../mgsc_1042/extras/browse/m04008/m0400821.imq.jpg`, and that resolves to a
**98,911-byte JPEG (HTTP 200, `image/jpeg`)** through the archive service. It
also has **67 `pds3_label` fields, not ~22**. It is a good sparse-record
acceptance case — no `gather.time`, no normalized lighting geometry — but it
is not a no-browse case. The real no-browse cases are the five instruments
above.

One related detail: `Overview.js` currently checks the browse extension
against `IMAGE_EXTENSIONS` and falls back to the source URI when it doesn't
match. MGS browse files are `.imq.jpg` — double-extension paths that
`getExtension` needs to handle correctly, or MGS products will silently try to
render a `.imq` as an image.

### 6.2 File / related-product count

The mockup's "N files" needs a count of sibling products. The only mechanism
available is `gather.ancillary.group_id`, and it works well where present —
querying the M2020 Mastcam-Z group `1357_0787407533_428_64_0_zcam_110`
returns **62 sibling products across 21 product types** (FDR, RAD, RAS, ECM,
EDR, RNR, XYZ…); the Navcam group returns 65 across 30 types.

But `group_id` is **`mars_2020`-only** (97.2% there, 0.0% for all 20 other
missions). Options:

1. Ship the tile for M2020 only, config-gated. Cheap, honest, immediately
   useful for the largest actively-growing mission.
2. Fall back to `bundle_id` + `sol` + `instrument_category` for other surface
   missions. Approximate, and needs a per-mission grouping rule.
3. Ask the indexing team to extend `group_id` to other missions. Correct, but
   outside this repo and not on the critical path.

Recommendation: (1) now, (3) as a follow-up request. Either way this tile is
a **second query**, not a field — the API layer should issue it in parallel
with the record fetch and omit the tile on failure or timeout rather than
delaying the page.

### 6.3 Instrument and mission display names

`gather.common.instrument_name` is populated on only 14.3% of the index, and
notably **0% of `mars_2020`** — the exact mission the mockup is drawn from.
The mockup's "Navcam Right" and "Perseverance" have no index source.

`src/core/constants.js` already has `DISPLAY_NAME_MAPPINGS` for missions.
The proposal is to extend that idea into the record-detail config as a
dedicated vocabulary file:

```jsonc
// config/record-detail/vocabulary.json
{
  "spacecraft": { "perseverance": "Perseverance", "curiosity": "Curiosity",
                  "mars_global_surveyor": "Mars Global Surveyor" },
  "instrument": {
    "mars_2020": {
      "NAVCAM_RIGHT": { "long": "Navcam Right", "short": "Navcam R" },
      "MCZ_RIGHT":    { "long": "Mastcam-Z Right", "short": "Mastcam-Z R" }
    },
    "mgs": { "MOC": { "long": "Mars Orbiter Camera", "short": "MOC" } }
  },
  "target": { "mars": "Mars", "MARS": "Mars" }
}
```

91 instruments across 21 missions is a bounded, one-time authoring job.
Note `target` needs case folding: PDS4 gives `"mars"`, PDS3 gives `"MARS"`.

Longer term the PDS context products are the authoritative source for these
names, but pulling them in is a separate integration and shouldn't gate this.

### 6.4 Citations

`pds4_label.pds:Citation_Information/pds:doi` is in the mapping but populated
on **exactly one document out of 239 million**. There is no per-product DOI to
cite. Citations must be **composed** from `product_id` + `data_set_id` /
`bundle_id` + retrieval date (as in §4.5) and worded so they don't imply a
registered DOI. Bundle- or collection-level DOIs may exist in PDS registry
metadata, which would be a better citation target — worth confirming with the
PDS node before finalising citation wording.

### 6.5 Summary of gaps

| Gap | Severity | What it takes |
|---|---|---|
| PDS4 surface products lack normalized sol/LTST/RMC/Ls | **High** — affects ~26M MSL products | Label fallback chains (in this design), or a backend normalization pass (correct fix, external) |
| No normalized display names for M2020 instruments | Medium | `vocabulary.json`, ~91 entries, one-time |
| No `gather.time` for MGS / MGN / LO / most CLEM | Medium | Label fallback (`pds3_label.timestamp(imageTime)`) |
| MGS lighting geometry not normalized | Medium | Label fallback (`incidenceAngle` etc.) |
| `group_id` is M2020-only | Low | Config-gate the tile; request index extension |
| No per-product DOI | Low | Compose citation; confirm bundle-level DOI with PDS |
| PDS3 sentinels in orbiter angles | **High** — 66.7% of Cassini | Validity gate (§5) |
| `solar_azimuth` misfiled under `orbital_missions` for MSL/MER rovers | Low | Config reads the field where it actually is; flag to indexing team |

---

## 7. Validation

Three layers, cheapest first:

**1. Build/CI time — schema and static checks.**
- Every profile validates against `profile.schema.json`.
- Every `path` starts with a known root (`gather.`, `pds3_label.`,
  `pds4_label.`, `archive.`, `uri`, `release_id`) **and exists in a snapshot
  of `_mapping`** checked into the repo. This is the check that catches stale
  paths — the mapping snapshot is refreshed by a scheduled job that opens a
  PR when it drifts, so a field disappearing upstream surfaces as a red CI
  run rather than a blank tile.
- Every `format` / `extractor` name resolves to an allowlist entry.
- Every `extends` target exists; no cycles.
- Templates parse; every `{{token}}` maps to a tile declared in the resolved
  profile; every block (`description`, `caption`, `short_caption`, `alt_text`,
  `citation`) is present.

**2. Build time — golden fixtures.**
A committed corpus of ~30 real `_source` documents (one per configured
profile, including the deliberately awkward ones: `M0400821`, an MSL PDS4
Mastcam, a sentinel-heavy Cassini product, a `mess`/MDIS no-browse product)
with snapshot-tested resolved output. A template edit that breaks grammar on
a sparse record fails the snapshot instead of shipping.

**3. Runtime — fail soft, alert loud.**
Resolution errors never surface as broken prose. A profile that throws falls
back to `_default`; a template block that throws is omitted (the tiles still
render); both increment a metric and log the profile id + product URI. The
user-visible worst case is today's Atlas, not a page reading
`Sol undefined`.

Additionally, a **coverage report** in CI: for each configured profile, sample
N real products and report the percentage of declared tiles that actually
resolve. A profile whose tiles resolve 40% of the time is a config bug that
no schema check can catch — this is how you find it before users do.

---

## 8. Where template resolution happens

**Recommendation: resolve in the API layer, per request, with a cache. Do not
resolve at index time, and do not add SSR to Atlas.**

The response contract for `/record`:

```jsonc
{
  "uri": "atlas:pds4:mars_2020:...",
  "presentation": {
    "description": "On Sol 383 of the Mars 2020 mission (2022-03-19, 12:50:44 local true solar time) the Navcam Right camera aboard Perseverance imaged Mars from Site 13, Drive 65. ...",
    "caption": "Navcam Right — Sol 383, 12:50 LTST",
    "shortCaption": "Navcam R · Sol 383",
    "altText": "Navcam Right image of the Martian surface at Site 13, Drive 65",
    "citation": "Perseverance Navcam Right, urn:nasa:pds:mars2020_navcam_ops_calibrated:data:nrm_0383_... NASA Planetary Data System, mars2020_navcam_ops_calibrated, release 8. Retrieved from Atlas, 2026-08-20.",
    "links": [
      { "text": "Perseverance", "kind": "spacecraft", "value": "perseverance" },
      { "text": "Navcam Right", "kind": "instrument", "value": "NAVCAM_RIGHT" }
    ],
    "tiles": [
      { "id": "sol",   "label": "Sol",                  "value": "383" },
      { "id": "ltst",  "label": "Local true solar time", "value": "12:50:44" },
      { "id": "rmc",   "label": "Rover motion",          "value": "Site 13 · Drive 65" }
    ]
  }
}
```

Strings only. No template source, no token names, no profile id, no
"8 tokens resolved, 1 optional clause skipped" — the mockup shows that
provenance line and it must not ship. Nothing in this payload lets a client
infer that templating exists. `links` carries *resolved* text plus a semantic
kind so the frontend can render the mockup's underlined links without
knowing anything about templates.

The frontend's entire job becomes: render `presentation.description`, render
`presentation.tiles` in order, use `presentation.altText` on the `<img>`.
No conditional field logic in React at all.

### 8.1 Why not index time

Pre-computing resolved strings into the index is attractive until a template
changes:

- Any edit to a shared template or to `vocabulary.json` requires reindexing
  the affected population. For `_default` or a spacecraft display name, that's
  tens of millions of documents.
- It makes prose a *data migration*, so fixing a typo needs an indexing run
  and a deploy window. Iteration on wording is exactly what this design needs
  to be cheap.
- It couples Atlas's UI copy to a pipeline in a different team's repo.
- It bloats the index with per-language, per-variant strings if localisation
  ever appears.

The one thing index-time resolution genuinely buys is search over description
text. If that becomes a requirement, the right shape is a narrow additional
indexed field for search only, with display strings still resolved at request
time.

### 8.2 Why not SSR

Atlas is a CRA SPA (`scripts/start-prod.js` serves a static build). Adding a
server-render path for one route means introducing a Node render tier, a
second place templates execute, and hydration mismatch risk — for no benefit
over an API field. If SEO for `/record` ever becomes a goal, revisit; today
it isn't a reason to restructure the app.

### 8.3 Request-time cost, and the payload win

Resolution is string interpolation over an already-fetched document —
sub-millisecond. The cache key is
`(profile_id, config_version, uri, release_id)`, so a template edit
invalidates by bumping `config_version`: no reindex, no purge script.

There is also a concrete win here. `searchRecordByURI` in
`src/core/redux/actions/actions.js` fetches the full `_source` with **no
`filter_path`**, so the browser downloads everything:

| Product | Total `_source` | `gather` | Raw label |
|---|---:|---:|---:|
| M2020 Mastcam-Z RNR | 59,779 B | 1,700 B | 57,000 B (309 fields) |
| M2020 Navcam TDR | 53,880 B | 1,600 B | 51,000 B (309 fields) |
| MSL Mastcam PDS4 | 45,592 B | 1,082 B | 43,542 B |
| MRO HiRISE | 4,768 B | 1,693 B | 2,909 B |
| MGS MOC (`M0400821`) | 3,670 B | 1,100 B | 2,200 B (67 fields) |

For M2020 products ~93% of the payload is raw label that Overview never
reads. The Product Label tab does need it, but it can be fetched lazily on
tab activation. Resolving server-side and using `filter_path` for the
Overview turns a ~60 KB blocking fetch into a ~4 KB one — a mobile win that
comes free with this architecture.

---

## 9. Mobile plan

The constraint is that the shell (NASA/PDS topbar, Atlas branding, left icon
rail, title bar, tabs) stays unchanged. Atlas already has mobile handling for
those; `Overview.js` already switches to `flexFlow: column` at
`breakpoints.down('md')`. The existing left rail is an icon rail that already
collapses, so keeping it is not in tension with mobile — it costs ~56 px of
width, which is acceptable at 375 px. Verifying that on a real device is a
cheap, worthwhile confirmation before build.

| Breakpoint | Layout |
|---|---|
| **Desktop ≥ lg** | As mockup 1: description + at-a-glance in the light panel, dark viewer beside it. At-a-glance in 3 columns. |
| **Tablet md** | Single column: viewer first (full width, ~55vh), then **full description**, then at-a-glance in **2 columns**. Tabs stay horizontal. |
| **Phone < sm** | Viewer first, full width, ~45vh. Then **`shortCaption`** with a "More" disclosure that expands to `description` — the phone default is the short variant, per the design intent. At-a-glance **1 column** as label/value rows; capped at 4 tiles with "Show all" revealing the rest. Tabs become scrollable. |

Details:

- **Viewer before metadata on narrow** — the image is why users are on the
  page. This matches mockup 8's bottom-drawer intent while keeping mockup 1's
  document flow, and avoids building a drawer component.
- **3 → 2 → 1 columns** for at-a-glance. At 375 px, two columns of
  "Local true solar time / 12:50:44" wrap badly; single-column rows read
  cleanly. Tile labels need a `shortLabel` in the profile for this
  ("LTST" instead of "Local true solar time").
- **No-browse products** (§6.1) skip the viewer block entirely on narrow
  rather than rendering an empty dark box above the fold; at-a-glance is
  promoted to first content.
- The `presentation.tiles` order comes from config, so the phone truncation to
  4 tiles uses the same authored priority as desktop — mission engineers
  control what survives truncation, and there is no second mobile-only
  ordering to maintain.

---

## 10. Implementation breakdown

Estimated in Devin sessions. Assumes the resolved-string API recommendation.

| # | Work | Sessions | Notes |
|---|---|---:|---|
| 1 | Config schema, resolution engine, merge semantics, formatter/extractor allowlists | 1 | Pure logic, heavily unit-testable |
| 2 | Template engine (5 blocks, conditionals, `token:format`, constrained AST) | 1 | Deliberately small; no general-purpose templating |
| 3 | Validity gate + sentinel handling (§5) | 0.5 | Small but load-bearing |
| 4 | `vocabulary.json` for 21 missions / 91 instruments | 0.5 | Bounded authoring; needs a data-engineer review pass |
| 5 | Profiles + templates for the top ~25 triples (≈60% of products) | 2 | The real authoring cost; iterative with mission engineers |
| 6 | API integration: resolution endpoint, cache, `filter_path` slimming, `group_id` sibling query | 1.5 | **Cross-repo** — search proxy / Lambda is outside this repo |
| 7 | Frontend: rebuild Overview against `presentation`, light surface, dark viewer, at-a-glance, links | 2 | Bulk of the visual work |
| 8 | Mobile reflow + short-caption disclosure + no-browse empty states | 1 | |
| 9 | Validation: JSON Schema in CI, mapping-snapshot check, golden fixtures, coverage report | 1 | |
| 10 | Preview CLI for config authors | 0.5 | Replaces the "template studio" idea cheaply |
| 11 | Playwright coverage across profile shapes (rover, orbiter, sparse, no-browse) | 1 | Per `AGENTS.md` selector rules; no download clicks |
| | **Total** | **≈12** | |

Sequencing and risk:

- **Items 1–3 are the critical path** and are self-contained; they can land
  behind a flag before any visual change.
- **Item 6 is the schedule risk.** The search proxy is a different repo owned
  by a different team, so the API contract in §8 should be agreed *before*
  item 7 starts. If that coordination is slow, items 1–5 can be exercised
  client-side behind a flag — the record page already receives the full
  `_source` (§8.1), so a client-side prototype is possible with no backend
  change. That is a prototype path only, not the shipping architecture, since
  it would put template internals in the bundle.
- **Item 5 grows with ambition, not with difficulty.** Each additional profile
  is cheap; the question is only how much of the 40% long tail gets
  hand-authored versus left to `_default`.
- **The MSL PDS4 normalization gap (§3.4)** is the one item worth escalating
  to the indexing team in parallel. The fallback chains make it survivable,
  but 26M products reading their sol out of a raw label is a workaround, not
  a resting state.

---

## 11. Open questions

1. **Who owns the search proxy** and what is their appetite for a
   `presentation` block on the record response? This determines whether the
   architecture in §8 is available or whether the first release is
   client-side-resolved behind a flag.
2. **Can `gather.landed_missions` / `gather.lighting_geometry` be populated
   for PDS4 surface products?** This single change would materially simplify
   config for ~26M MSL products.
3. **Bundle- or collection-level DOIs** — do they exist in PDS registry
   metadata, and can Atlas cite them? Affects §6.4 wording.
4. **Can `gather.ancillary.group_id` be extended** beyond `mars_2020`? Decides
   whether the related-products tile is a per-mission special case or general.
5. **Is search over generated descriptions a requirement?** If yes, §8.1's
   narrow indexed-field carve-out needs designing in from the start.
6. **Who are the named config owners per mission?** The schema and validation
   only pay off if there is someone expected to author profiles for their
   mission.

---

## Appendix: verification notes

- Presence percentages: `exists` filter aggregations nested under
  `terms(gather.common.mission)` and under mission × instrument filters, with
  `track_total_hits: true`.
- Sentinel scan: `range` queries for `|value| > 1e29` on all numeric
  `gather.lighting_geometry.*` and `gather.orbital_missions.*` fields per
  mission.
- Config-space sizing: `composite` aggregation over
  `mission × instrument × product_type`, paged to exhaustion (882 buckets).
- Documents inspected in full: M2020 MCZ_RIGHT RNR, M2020 NAVCAM_RIGHT TDR,
  MSL MAST_LEFT (both PDS3 and PDS4), MER PANCAM, MRO HiRISE, Cassini,
  MGS MOC `m0400821.imq`.
- Asset resolution checked with `curl -L` against
  `https://pds-imaging.jpl.nasa.gov/api/data/<uri>::<release_id>`.
- No write operations were performed against any PDS service, and no download
  affordances were exercised.
