# Record Detail Redesign (Mockup 1) — Assessment and As-Built Notes

Technical assessment of whether the "Overview redesign" direction can be built
against Atlas's real data, the configuration design it produced, and — in §12 —
what actually shipped.

Sections 0–11 are the assessment as reviewed. **§12 is authoritative for the
code in this repo**; where the two differ, §12 wins.

Revised after review against three constraints:

1. **No derived or computed fields** — the caption may interpolate
   `{{indexed.field.path}}`, nothing else (§4.5).
2. **The config file count must be small** — measured, not asserted: 25 files
   for 100% coverage, 9 for 95.5% of products (§4.1).
3. **If a field has no normalized path, omit it** — no raw-label fallbacks
   (§4.6). Tiles bind to `gather.*` / `archive.*` only.

Constraints 1 and 3 together cut six things mockup 1 shows — sequence,
processing level, PDS4 rover motion counters, file count, DOI and the generated
prose description. §3.4 lists each one with what it would take to get it back.
Sol, Site and Drive **are kept**: they are normalized for every rover
population except `msl` PDS4, which is the single cut worth fixing upstream
(§11 Q1).

Effort drops from ≈12 sessions to ≈8 (§10).

---

## 0. Verdict

Mockup 1 is implementable, but **not as a single layout driven by one set of
fields.** The evidence below shows four things that shape the whole design:

1. **There is no universal at-a-glance vocabulary — and no universal field at
   all** beyond `mission`, `spacecraft`, `instrument`, `target`,
   `product_type`, `file_name`, `pds_standard` and the label URI. Even
   `gather.time.start_time`, which Atlas uses as its default sort field, is
   absent for 100% of MGS, Magellan and Lunar Orbiter products and 99.8% of
   Clementine products.
2. **The correct configuration axis is not `mission → instrument → processing
   level`.** It is `mission → pds_standard`, and **nothing below that**.
   `pds_standard` matters more than instrument: the *same instrument on the
   same spacecraft* has a completely different normalized field set depending
   on whether the product was archived as PDS3 or PDS4 (§3.5). Instrument, by
   contrast, turns out **not to need a config layer at all** (§4.1), and
   `processing_level` cannot be a resolution key, because it only exists
   inside the raw PDS4 label (24.7% of products with a mission; 6.2% of all
   239.7M index documents) and has no PDS3 equivalent.
3. **That means 25 config files for 100% coverage of the index, not 882.**
   Nine files cover 95.5% of all products (§4.1). This was the main open
   question after the first draft, and the measurement below settles it.
4. **Several fields the design wants are archived but never normalized** —
   they exist only in `pds3_label` / `pds4_label`. Per the "normalized paths
   only" constraint these are **omitted rather than read out of the raw
   label** (§4.6). That is a correctness win and a coverage loss: it is why MSL
   PDS4 and MGS records are thin (§3.5), and it turns backend normalization
   from a nice-to-have into the highest-value follow-up (§6, §11).

No derived or computed fields are required (§4.5). Every tile is a single
direct reference to one normalized indexed field; the one place interpolation
happens is the caption, and it is `{{path}}` substitution with fragment-level
drop-out.

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
6. To size the config set (§4.1), measured presence of a 38-field candidate
   tile pool across all 25 mission × `pds_standard` populations **and**
   separately for each of the 91 instruments inside them, to test whether
   instrument-level config is actually necessary.

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

Those 882 triples are the number of distinct **field-availability shapes** in
the index. They are *not* the number of config files needed — §4.1 measures
that separately and the answer is **25**. If the 882 were the config count the
design would be untenable, so that measurement is the load-bearing one; the
table below is included only because it is the natural first thing to look at,
and it is misleading on its own:

| Triples configured | Share of products covered |
|---|---|
| 5 | 40.2% |
| 10 | 47.2% |
| 25 | 59.5% |
| 50 | 71.7% |
| 100 | 83.2% |
| 200 | 92.2% |
| 882 (all) | 100% |

The reason one config can serve many triples is that instruments within a
mission mostly differ by *having fewer* of the same fields, which tile drop-out
handles for free. See §4.1.

Products by mission:

| Mission | Products | Mission | Products |
|---|---:|---|---:|
| `msl` | 30,343,153 | `mgs` | 243,227 |
| `mars_2020` | 10,004,185 | `lcro` | 113,044 |
| `mer` | 7,049,275 | `lro` | 77,205 |
| `ody` | 2,797,610 | `mgn` | 72,818 |
| `mro` | 2,725,454 | `vik` | 64,514 |
| `mess` | 2,619,601 | `juno` | 39,744 |
| `clem` | 1,914,652 | `go` | 20,122 |
| `cas` | 916,485 | `mpf` | 17,712 |
| `vgr` | 577,401 | `ch1` | 12,152 |
| `nsyt` | 315,305 | `lo` | 2,990 |
| `phx` | 256,433 | | **60,183,082** |

Only four missions have products under both PDS standards — `msl`
(23,430,052 PDS3 / 6,913,101 PDS4), `mess` (1,309,800 / 1,309,801), `vgr`
(546,824 / 30,577) and `vik` (6,585 / 57,929). That split is what §4.3 keys on,
and it is why the config count is 25 rather than 21.

---

## 3. Field-by-field availability for mockup 1

### 3.1 What mockup 1 actually asks for

Extracted from mockup 1 (`01-overview-redesign`, PR #20). The description
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
- **L** — exists only in the raw label, not normalized. Under the
  "normalized paths only" rule (§4.6) an **L** field **does not ship** — it is
  cut from the design (§3.4) until someone normalizes it
- **D** — must be derived/computed. Derivation is out (§4.5), so a **D** field
  is also cut (§3.4)
- **X** — not in the index at all

Every field in the table below is either shippable (**U**/**M**/**I**/**S**,
because it has a normalized path) or cut (**L**/**D**/**X**). There is no
middle category and no workaround tier: the design reads normalized fields and
nothing else.

### 3.3 Availability table — fields the design ships

Percentages are of products in that population. Everything here has a
normalized `gather.*` / `archive.*` path.

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
| Instrument display name | `gather.common.instrument_name` | **M,S** | 57.1% of mission-bearing products. `mer`/`mgs`/`phx`/`mgn`/`juno`/`go`/`mpf`/`lo`/`clem` 100%, `cas` 99.8%; **all of `mars_2020` 0%**, `mro`/`ody`/`nsyt`/`lro`/`ch1` 0%; `msl` 77.2% (= 100% of its PDS3, 0% of its PDS4) |
| Product type display name | `gather.common.product_type_name` | **M,S** | `ody`/`phx` 100%, `mer` 95.8%, `msl` 77.2% (PDS3 only), `mess` 26.6%, `cas` 0.4%; `mars_2020` 0% |
| Sol / planet day | `gather.landed_missions.planet_day_number` | **M,S** | `mer`/`phx` 100%, `nsyt` 99.6%, `mars_2020` 99.2%, **`msl` 77.2%** (PDS3 only), `mpf` 0%; all orbiters 0% |
| **LTST** | `gather.landed_missions.start_local_true_solar_time` | **M,S** | **only `mars_2020` 98.4% and `nsyt` 99.3%.** `msl` 0%, `mer` 0%, `phx` 0% — see §3.5 |
| LMST | `...start_local_mean_solar_time` | **M,S** | same distribution as LTST |
| Site | `gather.landed_missions.rmc_site` | **M,S** | `mer` 100%, `nsyt` 99.7%, `phx` 100%, `mars_2020` 98.6%, `msl` 77.2% (PDS3 only) |
| Drive | `gather.landed_missions.rmc_drive` | **M,S** | `mer` 100%, `nsyt` 99.7%, `mars_2020` 98.1%, `msl` 77.2%, **`phx` 0%** (a lander doesn't drive) |
| Instrument az/el | `gather.landed_missions.site_instrument_azimuth` / `_elevation` | **M,I** | `mars_2020` 94.0% (MCZ 99%, NAVCAM 100%, **HELI_NAV 14%**), `nsyt` 99.3%, `phx` 92.2%, `mer` 10.6%, `msl` 1.9% |
| Solar az/el (surface) | `gather.landed_missions.site_solar_azimuth` / `_elevation` | **M,I** | `phx` 100%, `nsyt` 99.3%, `mars_2020` 94.5%, `mer` 12.1%, `msl` 1.9% |
| Ls (solar longitude) | `gather.lighting_geometry.solar_longitude` | **M,I** | `nsyt` 99.3%, `phx` 99.7%, `mro` 88.8%, `msl` 77.1% (PDS3 only), `mars_2020` 66.5% (NAVCAM only 53%), `mer` 12.1% |
| Bundle | `gather.pds_archive.bundle_id` | **S** | PDS4 only, and exactly tracks each mission's PDS4 share: `mars_2020`/`nsyt` 100%, `vik` 89.8%, `mess` 50.0%, `msl` 22.8%, `vgr` 5.3%; all PDS3-only missions 0% (they have `data_set_id` / `volume_id` instead) |
| Release | `gather.pds_archive.release_id` | **M** | `nsyt` 100%, `vik` 89.8%, `mars_2020` 77.4%, `mess` 50.0%, `msl` 22.8%; PDS3 missions 0% in `gather` (top-level `release_id` still present) |
| Colour / filter | `gather.ancillary.color_filter` | **M** | `mars_2020` 97.2%; 0% elsewhere. `gather.common.filter` covers `mer` 98%, `mgs` 100%, `mro` 81% |
| Orbit number | `gather.orbital_missions.orbit` | **M** | `mgs`/`ody`/`mro` (99.7%)/`ch1` 100%, `vik` 80.0%, `go` 45.8%, `mess` 36.4%; all rovers and landers 0% |
| Incidence / emission / phase | `gather.lighting_geometry.*` | **M** | `lo` 100%, `cas` 99.6%, `mro` 99.7%, `clem` 99.3%, `go` 67.9%, `mess` 49.8%; **`mgs` 0.0%** (label only → omitted for MGS). Sentinel-contaminated on `cas` — see §5.2 |
| Spacecraft altitude | `gather.orbital_missions.spacecraft_altitude` | **M** | `juno`/`lo` 100%, `mro` 99.7%, `clem` 99.3%, `mess` 49.8%, **`cas` 0%**, **`mgs` 0.0%** (label only → omitted for MGS) |
| Sub-spacecraft lat/lon | `gather.orbital_missions.sub_spacecraft_*` | **M** | `mro`/`cas`/`clem` 100%, `mess` 99%, **`mgs` 0.0%** (label only → omitted for MGS) |
| Geo footprint / location | `gather.common.geo_footprint` / `geo_location` | **M** | footprint: `ody` 94%, `clem` 94%, `mgn` 99%, `mgs` 72%, `mro` 19%; 0% for all rovers |
| Asset size | `archive.size` | **U** | 98.4% index-wide |

### 3.4 Cut from the design

Six things mockup 1 shows are **not in the shipped design**, because each would
require either reading a raw label path or computing a value. They are listed
here rather than quietly dropped, so that the mockup and the spec can be
reconciled and so the cost of the two constraints is explicit.

| Cut | Class | Why | What it would take to get it back |
|---|---|---|---|
| **Sequence** | **L** | No `gather` path. Labels only: `pds4_label.msn_surface:Command_Execution/msn_surface:sequence_id` (`mars_2020` 95%, `msl` 16.9%), `pds3_label.sequenceId` (11.9% index-wide) | Normalize to `gather.ancillary.sequence_id`. Cheap — it is a scalar string already in the label |
| **Processing level** | **L,S** | Labels only: `pds4_label.pds:Primary_Result_Summary/pds:processing_level` (6.2% index-wide, PDS4 only), `pds3_label.Processing_Level_Id` (0.02%) | Normalize, *and* reconcile the PDS3/PDS4 vocabularies (`Calibrated` / `Derived` / `Partially Processed` vs PDS3 level ids) — a modelling decision, not just an indexing pass |
| **Rover motion counter (PDS4)** | **D,L** | Parallel arrays `geom:index_id[]` / `geom:index_value_number[]`; "Site 5" only exists after zipping the two by name | Normalize `rmc_site` / `rmc_drive` at index time, exactly as PDS3 already does. **This is the one cut with a large product cost** — see below |
| **File / related-product count** | **D** | Requires a second aggregation query on `gather.ancillary.group_id`, which is `mars_2020`-only (97.2%; 0% elsewhere) | Either a per-record count at index time or an explicit second API call. Not a tile in any case (§6.2) |
| **Citation DOI** | **X** | `pds4_label.pds:Citation_Information/pds:doi` is in the mapping but populated on **1 document out of 239M** | Nothing on our side — DOIs would have to be minted and archived upstream |
| **Generated prose description** | **X** | No description field exists for the vast majority of products; `pds3_label.description` / `RATIONALE_DESC` cover ~1–2% and are label-only | Prose would have to be composed from fields, i.e. derived. Out of scope (§4.9) |

Consequences for the page itself:

- The Overview **leads with the caption and the at-a-glance block**, not with a
  paragraph. The prose lead in mockup 1 (`01-overview-redesign`, PR #20) should be
  re-drawn before implementation — see §4.9.
- The mockup's `"Calibrated color (CWG)"` line comes from `product_type` /
  `product_type_name`, not from a processing level.
- Sol, Site and Drive **do ship** — for every population where they are
  normalized: `mer` 100%, `phx` (sol/site) 100%, `nsyt` 99.7%, `mars_2020`
  98–99%, and **`msl` PDS3, 23.4M products, 100%**. The only rover population
  that loses them is `msl` PDS4 (6.91M), where none of the three is normalized.
  That is the cut worth fixing first (§11 Q1).
- Config authors cannot *express* any of the cut fields: validation rejects a
  profile referencing a path outside `gather.*` / `archive.*` (§7), so the cuts
  hold by construction rather than by convention.

### 3.5 The finding that most affects the design: `pds_standard` outranks instrument

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
essentially *all* PDS4 products.

An earlier draft of this document proposed per-field fallback chains
(`gather` path first, named label path second) to close the gap from the
presentation layer. **That is withdrawn**: per the "normalized paths only"
rule, a field with no normalized path is omitted (§4.6). The consequences are
worth stating plainly rather than burying, because this is the design's largest
single content cost:

| Population | Products | Effect of omitting label-only fields |
|---|---|---|
| `msl` PDS4 | 6,913,101 | Only 8 `gather` fields exist at all. No sol, site, drive, LTST, Ls, instrument display name or product type name — the at-a-glance block falls back to target / product type / time / SCLK |
| `mgs` | 243,227 | No time, no lighting geometry, no altitude, no sub-spacecraft lat/lon. Orbit, filter, target, product type, mission phase, `data_set_id` and geo location survive (§4.7) |
| `mars_2020`, `msl` (both) | 40.3M | No sequence tile anywhere |
| All PDS4 | 14.9M | No processing level tile |

The fix is the same in every row: **a normalization pass that populates
`gather.landed_missions` / `gather.lighting_geometry` / `gather.time` from
labels already in the index.** That is a backend/indexing change outside this
repo (§11 Q1). Rather than being a nice-to-have that fallback chains let us
defer, it is now the highest-value follow-up the redesign has — and unlike a
presentation-layer workaround it fixes search, sorting and faceting at the same
time, for every consumer of the index, not just this page.

Note also the RMC shape difference: PDS3 gives `rmc_site` / `rmc_drive` as
discrete normalized fields; PDS4 gives two parallel arrays
(`index_id[]` / `index_value_number[]`) that must be zipped by name — position
2 of `index_value_number` means "DRIVE" only because position 2 of `index_id`
says so. Reading a path cannot do this, and under the no-derived-fields rule
(§4.5) nothing in the presentation layer may do it either. So this field is
excluded twice over — by §4.5 for being derived and by §4.6 for being
label-only. The honest options are:

- **Normalize it at index time** (recommended). One backend change makes
  Site/Drive tiles work for all PDS4 surface products, and it is the same
  change already wanted for `gather.landed_missions` generally.
- **Until then, PDS4 surface products show no Site/Drive tile.** They drop out
  like any other absent field, which is graceful but is a real content gap on
  6.91M MSL products.

Recommend the first and ship with the second. What is *not* recommended is
putting an array-zipping extractor in the presentation layer to paper over a
normalization gap.

---

## 4. Proposed configuration design

### 4.1 How many configs are actually needed: 25, not 882

The first draft of this assessment reported 882 mission × instrument ×
product_type triples. **That is the size of the field-availability problem
space, not the number of config files**, and quoting it without the follow-up
measurement was misleading. This section is the follow-up measurement.

The question that decides the config count is: *within one mission and one PDS
standard, do different instruments actually disagree about which fields exist?*
If they don't, an instrument config layer buys nothing.

Measured across all 25 mission × `pds_standard` populations, for a 38-field
candidate tile pool, per instrument (91 instruments), counting a field as
"present" for an instrument at ≥95% of that instrument's products:

| Populations | Instruments agree on every field? |
|---|---|
| 15 of 25 | Yes — zero disagreement |
| 10 of 25 | Some disagreement, but see below |

And of the disagreements, almost all are **subtractive**: the instrument has
*fewer* fields than its mission sibling, not different ones. Declaring the
**union** of the instrument pools at the mission × standard level and letting
absent tiles drop out — which the design already has to do for missing values —
reproduces every instrument's correct tile set exactly:

| Population | Products | Instruments | Union pool | Tiles a given instrument shows |
|---|---:|---:|---:|---|
| `msl/pds3` | 23,430,052 | 15 | 14 | 9–14 |
| `mars_2020/pds4` | 10,004,185 | 19 | 23 | 12–23 |
| `mer/pds3` | 7,049,275 | 4 | 13 | 12–13 |
| `msl/pds4` | 6,913,101 | 6 | 8 | 8 |
| `ody/pds3` | 2,797,610 | 2 | 10 | 9–10 |
| `mro/pds3` | 2,725,454 | 3 | 17 | 15–17 |
| `cas/pds3` | 916,485 | 3 | 15 | 6–15 |
| `mgs/pds3` | 243,227 | 1 | 8 | 8 |

Across all 25 populations the union adds 34 tile-declarations in total over the
population-wide pools — an average of 1.4 extra lines per config file. That is
the entire price of eliminating the instrument layer.

Worked illustration, `msl/pds3`. The population-wide stable pool is 9 fields;
the union is 14. The extra 5 are `start_time`, `stop_time`, `sclk`,
`creation_time`, `frame_type`:

```
NAV_RIGHT_B   9,040,642  →  14 tiles  (has all five)
MAST_LEFT     1,094,098  →   9 tiles  (has none of the five; they drop out)
MAHLI           451,076  →   9 tiles
MARDI            64,543  →   9 tiles
```

One config file, correct output for all 15 instruments. Compare `cas/pds3`,
the worst case in the index: ISS shows 15 tiles, VIMS 13, and RADAR — a
non-imaging instrument — 6. Still one file.

#### Config count and coverage

So the resolution set is one file per mission, plus a small override for the
four missions that have products under both PDS standards (`msl`, `mess`,
`vgr`, `vik`):

**21 mission files + 4 standard overrides = 25 files, covering 100% of the
60.2M products that have a mission**, plus one `_default.json`.

They do not have to land at once. Ordered by product count:

| Config files | Products covered | Share |
|---:|---:|---:|
| 1 (`msl/pds3`) | 23,430,052 | 38.9% |
| 2 (+`mars_2020/pds4`) | 33,434,237 | 55.6% |
| 3 (+`mer/pds3`) | 40,483,512 | 67.3% |
| 4 (+`msl/pds4`) | 47,396,613 | 78.8% |
| 5 (+`ody/pds3`) | 50,194,223 | 83.4% |
| 6 (+`mro/pds3`) | 52,919,677 | 87.9% |
| 7 (+`clem/pds3`) | 54,834,329 | 91.1% |
| 8 (+`mess/pds4`) | 56,144,130 | 93.3% |
| 9 (+`mess/pds3`) | 57,453,930 | **95.5%** |
| 12 (+`cas`, `vgr/pds3`, `nsyt`) | 59,232,544 | 98.4% |
| 25 (all) | 60,183,082 | 100.0% |

**Recommended plan: write 9 files, ship, then fill in the tail.** The remaining
16 cover 4.5% of products and are mostly single-instrument missions with 6–11
field pools, so they are the cheapest ones to write.

Two things make this hold up rather than being an averaging trick:

- **`maxTiles` matters more than the union size.** `mars_2020/pds4` has a
  23-field union but the mockup shows ~8 tiles. The config declares the
  ordered pool and a cap; the resolver takes the first N that resolve. A large
  union is therefore a *ranked preference list*, not 23 rendered tiles.
- **The floor is guarded by `_default`.** `go/pds3` NIMS resolves only 3 tiles
  from its union. That is not a config failure, it is a genuinely sparse
  product, and §4.10 defines what the page looks like there.

#### When to add a narrower config anyway

Never for field *availability* — drop-out handles that. Only for editorial
reasons, and each should be justified in review:

- An instrument wants a **different tile order** (RADAR should not lead with
  incidence angle).
- An instrument wants a **different caption sentence** (helicopter products on
  M2020 read oddly with rover phrasing).

Expect a handful of these, not dozens. The schema supports them (§4.3) so the
option exists, but the coverage argument above does not depend on any of them
being written.

### 4.2 Where config lives and who owns it

**Recommendation: versioned JSON in this repo, consumed by the API layer, not
the browser.**

```
config/record-detail/
├── schema/
│   └── profile.schema.json          # JSON Schema for a profile
├── fields.json                      # field catalog: label, unit, precision, valid range
├── formatters.js                    # named, allowlisted value formatters
├── _default.json                    # generic fallback profile
└── mission/
    ├── msl.json
    ├── msl.pds4.json                # override, only for missions with both standards
    ├── mars_2020.json
    ├── mgs.json
    └── …                            # 25 files total
```

Rationale:

- **Not a database.** Atlas has no database (`AGENTS.md`), and adding one for
  25 config files would be the largest single cost in this project for no
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

### 4.3 Resolution order

Two layers, plus a fallback:

```
_default
  → mission/<mission>.json
    → mission/<mission>.<pds_standard>.json      (only where it exists)
```

Deviation from the `mission → instrument → processing level` order in the task,
and why:

- **`pds_standard` replaces instrument as the second key**, because §3.5 shows
  it is the strongest predictor of which normalized fields exist. It is 100%
  populated, so it is always available as a key. Only 4 missions need it.
- **Instrument is not a layer**, per §4.1 — instrument variation is handled by
  tile drop-out, not by config. The schema keeps an optional `instrument`
  override block for editorial cases, but resolution does not require it.
- **`processing_level` is dropped as a key.** It only exists inside the PDS4
  label (24.7% of mission-bearing products, zero PDS3 coverage), so keying on
  it would leave three quarters of products unkeyable. It is not available as a
  display value either, being label-only (§3.4). `product_type` is ~97.6%
  populated and is already an Atlas facet, so it is the better discriminator if one is ever
  needed — but §4.1 shows one isn't.

Merge semantics (deliberately boring, because two layers is all there is):

- Scalars (`maxTiles`, `emptyState`) — child replaces parent.
- `tiles` — an ordered array of field references; a child that declares `tiles`
  **replaces** the parent's array outright. No positional merging, no
  order-integer arithmetic, no `null`-to-suppress. With two layers, "write the
  list you want" is clearer than any merge rule, and it removes the entire
  class of bugs where an inherited rover tile leaks onto an orbiter page.
- `caption` — same: child replaces parent.

**Multi-valued instrument.** `gather.common.instrument` is an array on PDS4
(`["MCZ_RIGHT","MCAMZ_BOTH"]`). Because instrument is no longer a resolution
key, this stops being a resolution problem at all — it is only a *display*
problem, handled by the instrument tile's formatter joining values. This is a
direct simplification from dropping the instrument layer.

### 4.4 The field catalog: declare labels and units once

Everything that is a property *of a field* rather than *of a page* lives in one
`fields.json`, keyed by ES path — not repeated in every mission config:

```jsonc
{
  "gather.landed_missions.planet_day_number": {
    "label": "Sol", "shortLabel": "Sol", "format": "integer"
  },
  "gather.landed_missions.start_local_true_solar_time": {
    "label": "Local true solar time", "shortLabel": "LTST", "format": "clock"
  },
  "gather.landed_missions.rmc_site": { "label": "Site", "format": "integer" },
  "gather.landed_missions.rmc_drive": { "label": "Drive", "format": "integer" },
  "gather.lighting_geometry.incidence_angle": {
    "label": "Incidence angle", "shortLabel": "Incidence",
    "format": "number", "unit": "°", "precision": 1,
    "valid": { "min": 0, "max": 180 }          // rejects the ±1e30 sentinel, §5.2
  },
  "gather.orbital_missions.spacecraft_altitude": {
    "label": "Spacecraft altitude", "shortLabel": "Altitude",
    "format": "number", "unit": "km", "precision": 0
  },
  "gather.common.instrument_name": { "label": "Instrument", "format": "text" }
}
```

Why this split matters for the size question: it is the difference between a
mission config being ~15 lines and ~150. "Incidence angle is in degrees, 0–180,
one decimal" is true everywhere it appears, so it is stated once for the whole
system rather than once per mission that shows it. The catalog needs about 40
entries to cover the entire candidate pool measured in §4.1, and it is written
once.

`format` names resolve against an allowlist in `formatters.js`. They are
**display formatters, not derived values** — `integer`, `number`, `text`,
`clock`, `utc_datetime`, `title_case`, `join`. No expressions, no `eval`, no
arbitrary JS in config.

### 4.5 No derived fields

Per the constraint, **every tile is a direct reference to an indexed field.**
The first draft proposed named extractors (`rmc`, `az_el_pair`, `lat_lon_pair`,
`angle_triple`); all are removed. Each was combining two or three fields into
one composite tile, and in every case the fix is simply to declare the fields
as separate tiles:

| First draft (derived) | Now |
|---|---|
| `rmc` → "Site 13, Drive 65" | two tiles: `rmc_site`, `rmc_drive` |
| `az_el_pair` → "az 248.4° / el 38.8°" | two tiles: `site_instrument_azimuth`, `site_instrument_elevation` |
| `angle_triple` → "i 43° / e 12° / p 38°" | three tiles: `incidence_angle`, `emission_angle`, `phase_angle` |
| `lat_lon_pair` → "14.2°N 175.5°E" | `gather.common.geo_location` where present; otherwise two tiles |

This costs some visual density — three tiles for the lighting angles where the
mockup shows one — but it buys the thing that matters: a tile is a field, so
"which field is this?" always has a one-word answer, and drop-out is per-field
instead of all-or-nothing. In the mockup's own MGS panel the three angles are
already listed separately, so the design does not actually depend on the
composite form.

Two consequences worth being explicit about:

- **Formatting is not derivation.** Rendering `38.7834` as `38.8°` is a
  display concern declared in the field catalog (§4.4), as is rejecting
  `1e+30` via `valid` (§5.2). Neither invents a value.
- **One case genuinely cannot be done without derivation** — PDS4 rover motion
  counters, which are parallel arrays (§3.4, §3.5). The recommendation there is to
  normalize at index time rather than to reintroduce an extractor.

### 4.6 Normalized paths only

A tile is **one path**, and that path must be a normalized field: `gather.*` or
`archive.*`. If the field the design wants has no normalized path, the tile is
not configured at all — the fallback-into-`pds3_label`/`pds4_label` mechanism
proposed in the first draft is withdrawn.

Why it is worth the coverage loss (§3.4 quantifies it):

- **Raw label paths are not a stable interface.** `pds3_label` has 1,550 leaf
  fields and `pds4_label` 877, unnormalized across missions, with names like
  `pds3_label.timestamp(imageTime)` and
  `pds4_label.geom:Derived_Geometry/geom:solar_azimuth` — parentheses, colons
  and slashes inside single segments. A config full of those paths is a second,
  undocumented normalization layer living in the presentation tier.
- **A fallback hides the real problem.** With chains, MSL PDS4 renders a sol
  and nobody files the indexing ticket; without them, the gap is visible in
  §3.4 and fixable once for every consumer of the index — search, sort and
  facets included, not just this page.
- **It collapses the schema.** A tile is a string. No array form, no
  first-that-resolves precedence, no "which path produced this?" question, and
  no per-path escaping rules for label field names.

The rule is enforced, not merely documented: validation rejects any profile
referencing a path outside `gather.*` / `archive.*` (§7), so a well-meaning
label path cannot re-enter through a config edit.

### 4.7 Profile schema, and worked example — rover: `msl/pds3`

With labels and units in the catalog, a mission config is close to a bare
ordered list of paths:

```jsonc
{
  "$schema": "../schema/profile.schema.json",
  "match": { "mission": "msl", "pds_standard": "pds3" },

  // Ordered preference list — the union pool from §4.1, best tiles first.
  // Anything that doesn't resolve drops out; the first `maxTiles` that do are shown.
  "tiles": [
    "gather.landed_missions.planet_day_number",
    "gather.landed_missions.rmc_site",
    "gather.landed_missions.rmc_drive",
    "gather.common.instrument_name",
    "gather.common.product_type_name",
    "gather.lighting_geometry.solar_longitude",
    "gather.time.start_time",
    "gather.landed_missions.frame_type",
    "gather.time.spacecraft_clock_start_count",
    "gather.common.mission_phase_name",
    "gather.pds_archive.data_set_id"
  ],
  "maxTiles": 8,

  "caption": [
    "{{gather.common.instrument_name}}",
    "Sol {{gather.landed_missions.planet_day_number}}",
    "Site {{gather.landed_missions.rmc_site}}",
    "Drive {{gather.landed_missions.rmc_drive}}"
  ],

  "emptyState": "no_browse_generic"
}
```

That is the whole file for 23.4M products across 15 instruments. `MAST_LEFT`
resolves 9 of the 11 listed tiles; `NAV_RIGHT_B` resolves all 11 and shows the
first 8. No instrument-specific configuration.

Every entry is a single string. There is no array form and no fallback
precedence to reason about (§4.6). The sibling `msl/pds4` profile is the same
file with the unavailable tiles deleted:

```jsonc
{
  "match": { "mission": "msl", "pds_standard": "pds4" },
  "tiles": [
    "gather.common.product_type",
    "gather.time.start_time",
    "gather.time.spacecraft_clock_start_count",
    "gather.common.target",
    "gather.pds_archive.bundle_id",
    "gather.time.product_creation_time"
  ],
  "caption": [ "{{gather.common.instrument}}", "{{gather.common.target}}" ]
}
```

That is the honest shape of MSL PDS4 today: only a handful of `gather` fields
exist for these 6.91M products, and no sol, site, drive, LTST, Ls or display
name is among them (§3.5). The caption falls back to the instrument *code* because
`instrument_name` is 0% for this population. Normalizing
`gather.landed_missions` upstream turns this profile into the PDS3 one — which
is the argument for doing it.

### 4.8 Worked example — orbiter: `mgs/pds3`

Grounded in the real document the task named,
`atlas:pds3:mgs:mars_global_surveyor:/mgsc_1042/m04008/m0400821.imq`.

For this product `gather` contains only: mission, spacecraft, instrument,
`instrument_name` "MOC Narrow Angle", target, product_type `EDR`,
`mission_phase_name` "MAPPING", `filter` "N/A", `geo_location`,
`geo_footprint`, `orbital_missions.orbit` 1936, and archive identifiers.
**No `gather.time` at all**, and none of `gather.lighting_geometry` or the rest
of `gather.orbital_missions`. All of that *does* exist in the 67-field
`pds3_label` — `timestamp(imageTime)`, `incidenceAngle`, `emissionAngle`,
`phaseAngle`, `spacecraftAltitude`, `scaledPixelWidth` — and under §4.6 none of
it is available to the page. So the MGS profile is short, and honestly so:

```jsonc
{
  "$schema": "../schema/profile.schema.json",
  "match": { "mission": "mgs" },

  "tiles": [
    "gather.orbital_missions.orbit",
    "gather.common.instrument_name",
    "gather.common.product_type",
    "gather.common.geo_location",
    "gather.common.filter",
    "gather.common.mission_phase_name",
    "gather.pds_archive.data_set_id",
    "archive.size"
  ],
  "maxTiles": 8,

  "caption": [
    "{{gather.common.instrument_name}}",
    "orbit {{gather.orbital_missions.orbit}}",
    "{{gather.common.target}}"
  ],

  "emptyState": "no_browse_generic"
}
```

Eight tiles, all resolving for all 243,227 MGS products — a full at-a-glance
block, just not the one the mockup drew for an orbiter. The caption renders
*"MOC Narrow Angle — orbit 1936 — Mars"*.

One wrinkle this profile makes concrete: `gather.common.filter` on this product
is the **string `"N/A"`**, which the catalog's global reject list (§5.2) treats
as absent. So the tile drops out and the eighth slot goes unfilled — correct
behaviour, and a reminder that "present in `gather`" and "worth showing" are
different tests.

Note there is **zero overlap** between the MGS tile list and the MSL one. That
is the design working as intended, and it is why a single global field list
cannot produce this page. Note also that no `null`-suppression entries are
needed: because a child config replaces the tile array outright (§4.3), no
rover-shaped tile can leak in from a parent.

### 4.9 Captions

The caption follows the `{{path}}` model exactly: **a list of fragments, each
containing plain text and field references.** A fragment renders only if
*every* reference inside it resolves; otherwise the whole fragment is dropped.
Surviving fragments are joined with a separator.

```jsonc
"caption": [
  "{{gather.common.instrument_name}}",
  "Sol {{gather.landed_missions.planet_day_number}}",
  "{{gather.landed_missions.start_local_true_solar_time}} LTST"
]
```

M2020 Navcam Right, Sol 383 → *"Navcam Right — Sol 383 — 12:50:44 LTST"*
MSL Mastcam Left, PDS4 (no sol, no LTST normalized) → *"MASTCAM"*

This is why fragments rather than one string with conditionals: `"{{instrument}}
— Sol {{sol}}"` as a single template has to grow `{{#if}}` syntax the moment
`sol` is missing, and orphaned punctuation (`"MASTCAM — Sol "`) is the failure
mode that actually shows up in practice, more often than a bare `undefined`.
Fragment granularity gets grammatical output with **no conditional syntax at
all** — the config author writes only `{{path}}` and prose, and cannot express
a construct that renders `Sol undefined`.

The same structure produces the other variants the design needs, so they can
never disagree about the facts:

```jsonc
"caption":      [ "{{…instrument_name}}", "Sol {{…planet_day_number}}", "{{…ltst}} LTST" ],
"shortCaption": [ "{{…instrument_name}}", "Sol {{…planet_day_number}}" ],
"altText":      [ "{{…instrument_name}} image of {{gather.common.target}}" ],
"citation":     [ "{{gather.common.spacecraft}} {{…instrument_name}}",
                  "{{gather.pds_archive.product_id}}",
                  "NASA Planetary Data System",
                  "{{gather.pds_archive.data_set_id}}" ]
```

`shortCaption` is the phone variant (§9); `altText` is the accessibility
surface and is deliberately the plainest.

**There is no generated prose description** (§3.4). Mockup 1 leads with a
paragraph; the shipped page leads with the caption and the at-a-glance block.
The reasoning:

- The paragraph in the mockup is not a field. It is several fields plus
  connective English, which is derivation — exactly what §4.5 excludes. Doing
  it well also needs the `{{#if}}` guards the caption design deliberately
  avoids, since a paragraph cannot simply drop a clause and stay grammatical.
- Real archived prose exists for only ~1–2% of the index and is label-only
  (`pds3_label.description` / `RATIONALE_DESC`, e.g. this MGS product's
  *"Partial traverse of a surface covered in part by south polar frost"*), so
  §4.6 rules it out too. Ironically the best sentences available are the ones
  the constraints forbid.
- What is lost is smaller than it looks: everything the paragraph would have
  said is in the caption and the tiles already. What is gained is that no user
  ever reads a machine-assembled sentence about a product it got subtly wrong.

If prose is wanted later, the cheap version is a **sentence-list**: the same
fragment mechanism with whole sentences as fragments and `". "` as the
separator. Grammatical by construction, reads a little clipped, needs no
conditional syntax. That is the recommended path if §11 Q7 comes back wanting
a paragraph — not a template language.

Rendering is to a constrained AST, never HTML: text plus a small allowlist of
link nodes (mission, instrument, target — the underlined links in the mockup).
Never `dangerouslySetInnerHTML` over data derived from PDS labels.

### 4.10 The `_default` profile

An unconfigured mission, a brand-new instrument, or a product whose profile
resolves nothing must still render. `_default.json` uses only fields verified
near-universal in §3.3 and §4.1:

| Tile | Path | Index-wide presence |
|---|---|---|
| Target | `gather.common.target` | 100.0% |
| Product type | `gather.common.product_type` | 97.6% |
| Instrument | `gather.common.instrument` | 100.0% |
| Time | `gather.time.start_time` | 91.2% |
| Spacecraft clock | `gather.time.spacecraft_clock_start_count` | 84.3% |
| Archive (PDS3) | `gather.pds_archive.data_set_id` | 69.0% |
| Archive (PDS4) | `gather.pds_archive.bundle_id` | 24.7% |
| Mission phase | `gather.common.mission_phase_name` | 67.2% |
| Size | `archive.size` | 98.4% |

The two archive identifiers are mutually exclusive by PDS standard, so they are
listed as two ordinary tiles and drop-out picks the right one — which is what
replaces the fallback array the first draft would have used here.

`target` is the **only** field stable-present in all 25 populations, which is
why the default caption is minimal:

```jsonc
"caption": [ "{{gather.common.instrument_name}}", "{{gather.common.target}}" ]
```

This is intentionally close to what Atlas shows today, so the worst case for an
unconfigured product is "no better than the status quo", never "broken".

---

## 5. Missing values, sentinels, and null-ish data

"Field exists" is not "field is displayable". Four distinct failure classes
were observed, and resolution must handle all four before a value is accepted:

### 5.1 Absent path
The tile is **dropped**, and every caption fragment referencing it is dropped
whole (§4.9). With no fallback chains (§4.6) this is the *only* response to an
absent field, which makes it load-bearing rather than defensive: it is also the
mechanism that makes the instrument config layer unnecessary (§4.1) and the
mechanism by which a thin population like `msl` PDS4 still renders a coherent
page.

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

**Proposed validity gate**, applied to every candidate before acceptance. This
is a property of the *field*, not of the page, so it lives in the field catalog
(§4.4) and is written once for the whole system rather than per mission:

```jsonc
// defaults, applied to every field
{
  "reject": {
    "null": true,
    "emptyString": true,
    "sentinelMagnitude": 1e29,          // rejects ±1e30 and friends
    "values": ["N/A", "NULL", "UNK", "UNKNOWN", "NONE", "_", "-"]
  }
}

// per-field, in fields.json, only where a real domain exists
"gather.lighting_geometry.incidence_angle": { "valid": { "min": 0, "max": 180 } }
```

Note this is validity checking, not derivation (§4.5): rejecting `1e+30` does
not invent a value, it declines to display a non-value. Roughly 10 numeric
fields need an explicit `valid` range; the sentinel-magnitude and value-list
rules are global defaults, so no mission config mentions any of this.

The cleaner long-term fix is the same as for §3.5: sentinels should be stripped
at index time, so `exists` means "has a usable value". Until then the gate is
what stands between the redesign and `1e+30°` on two thirds of Cassini.

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

### 6.2 File / related-product count — cut

The mockup's "N files" is **not in the design** (§3.4). It is worth recording
why, because the data does exist for one mission.

The only mechanism is `gather.ancillary.group_id`, and it works well where
present — querying the M2020 Mastcam-Z group
`1357_0787407533_428_64_0_zcam_110` returns **62 sibling products across 21
product types** (FDR, RAD, RAS, ECM, EDR, RNR, XYZ…); the Navcam group returns
65 across 30 types. But:

- `group_id` is **`mars_2020`-only** (97.2% there, 0.0% for all 20 other
  missions), so the tile would exist on one mission and nowhere else.
- A count is not a field. It requires a second aggregation query, which makes
  it the only tile with its own latency and failure mode, and a *computed*
  value in the sense §4.5 excludes.

The Related Products tab already answers this question without a tile. If the
count is wanted later, the honest form is a per-record `sibling_count` produced
at index time, and the request to extend `group_id` beyond M2020 should go with
it.

### 6.3 Instrument and mission display names

`gather.common.instrument_name` is populated on 57.1% of products that have a
mission (14.3% of all 239.7M index documents), and notably **0% of
`mars_2020`** — the exact mission the mockup is drawn from. The mockup's
"Navcam Right" and "Perseverance" have no index source.

Sized precisely: of the 91 instrument codes in the index, **57 have no
display name for at least some of their products**. Nine missions have full
coverage and need no entries at all:

| Mission | Products | `instrument_name` | Instrument codes needing a name |
|---|---:|---:|---:|
| `msl` | 30,343,153 | 77.2% | 8 of 18 |
| `mars_2020` | 10,004,185 | **0.0%** | 23 of 23 |
| `mer` | 7,049,275 | 100.0% | 0 |
| `mro` | 2,725,454 | 0.0% | 3 of 3 |
| `mess` | 2,619,601 | 12.2% | 4 of 4 |
| `clem` | 1,914,652 | 100.0% | 0 |
| `mgs` | 243,227 | 100.0% | 0 |
| … | | | **57 total** |

So it is a 57-entry authoring job, not 91, and it is a **display-name lookup,
not a derived field** (§4.5) — the same category as the labels in the field
catalog. `src/core/constants.js` already has `DISPLAY_NAME_MAPPINGS` for
missions; the proposal extends that idea into the record-detail config:

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

Note `target` needs case folding: PDS4 gives `"mars"`, PDS3 gives `"MARS"`.
The instrument tile reads `gather.common.instrument_name` first and only
consults this table when that is absent, so the table shrinks automatically if
the index gains display names later.

One caveat on ordering the work: `mars_2020` needs all 23 of its entries
written before its config is useful, and it is the mission the mockup is drawn
from. Its 23 entries plus MSL's 8 cover 67% of all products.

Longer term the PDS context products are the authoritative source for these
names, but pulling them in is a separate integration and shouldn't gate this.

### 6.4 Citations

`pds4_label.pds:Citation_Information/pds:doi` is in the mapping but populated
on **exactly one document out of 239 million**, so there is no per-product DOI
and the DOI is cut (§3.4).

What remains is a `citation` fragment list like any other caption variant
(§4.9) — spacecraft, instrument, `product_id`, `data_set_id` / `bundle_id`,
all direct paths, no derivation — worded so it does not imply a registered DOI.
Bundle- or collection-level DOIs may exist in PDS registry metadata and would
be a better citation target; worth confirming with the PDS node before
finalising the wording (§11 Q3). If the answer is "cite the bundle DOI", the
citation becomes a single vocabulary lookup keyed on `bundle_id` rather than a
composed string.

### 6.5 Summary of gaps

| Gap | Severity | What it takes |
|---|---|---|
| PDS4 surface products lack normalized sol/LTST/RMC/Ls | **High** — affects 6.91M MSL PDS4 products, plus M2020 Ls gaps | Backend normalization pass. No presentation-layer workaround exists under §4.6, so this is the top ask (§11 Q1) |
| No normalized display names for M2020 instruments | Medium | `vocabulary.json`, 57 entries, one-time |
| No `gather.time` for MGS / MGN / LO / most CLEM | Medium | Normalize `pds3_label.timestamp(imageTime)` → `gather.time.start_time`. Until then no time tile for those missions |
| MGS lighting geometry / altitude not normalized | Medium | Normalize `incidenceAngle`, `emissionAngle`, `phaseAngle`, `spacecraftAltitude`. Until then MGS shows the 8 tiles in §4.8 (its worked profile) |
| Sequence and processing level not normalized | Medium | Cut from the design (§3.4); both are cheap normalizations if wanted |
| `group_id` is M2020-only | Low | Config-gate the tile; request index extension |
| No per-product DOI | Low | Compose citation; confirm bundle-level DOI with PDS |
| PDS3 sentinels in orbiter angles | **High** — 66.7% of Cassini | Validity gate (§5) |
| `solar_azimuth` misfiled under `orbital_missions` for MSL/MER rovers | Low | Config reads the field where it actually is; flag to indexing team |

---

## 7. Validation

Three layers, cheapest first:

**1. Build/CI time — schema and static checks.**
- Every profile validates against `profile.schema.json`.
- Every path starts with an allowed root — **`gather.` or `archive.` only**
  (§4.6), which is what mechanically enforces "no raw-label reads": a profile
  mentioning `pds3_label.…` or `pds4_label.…` fails CI.
- Every path **exists in a snapshot of `_mapping`** checked into the repo. This
  is the check that catches stale paths — the snapshot is refreshed by a
  scheduled job that opens a PR when it drifts, so a field disappearing
  upstream surfaces as a red CI run rather than a blank tile. The same job is
  how a *newly normalized* field gets noticed, which matters because §3.4's cut
  list is meant to shrink over time.
- Every path referenced in a `tiles` array or a `{{…}}` caption token **has an
  entry in `fields.json`**, so no tile can render without a label or unit.
- Every `format` name resolves to an allowlist entry.
- Caption fragments parse, and contain nothing but text and `{{path}}` tokens.
  Because there is no conditional syntax (§4.9), this is a regex-level check
  rather than a template-language parser — which is most of why the validation
  line item is cheaper than in the first draft.

**2. Build time — golden fixtures.**
A committed corpus of ~30 real `_source` documents (one per configured profile,
including the deliberately awkward ones: `M0400821`, an MSL PDS4 Mastcam, a
sentinel-heavy Cassini product, a `mess`/MDIS no-browse product, and a
`go`/NIMS product that resolves only 3 tiles) with snapshot-tested resolved
output. A config edit that produces a clipped caption on a sparse record fails
the snapshot instead of shipping.

Critically, the fixture set must include **more than one instrument per
configured mission**, since §4.1's whole argument is that one config serves all
of them. For `msl/pds3` that means a `NAV_RIGHT_B` (14 tiles) *and* a
`MAST_LEFT` (9 tiles); for `cas/pds3`, ISS *and* RADAR (15 vs 6). Without that,
the cheapest failure mode of this design — a config authored against the
biggest instrument and silently thin for the rest — goes undetected.

**3. Runtime — fail soft, alert loud.**
Resolution errors never surface as broken prose. A profile that throws falls
back to `_default`; a caption fragment that throws is dropped (the remaining
fragments and all tiles still render); both increment a metric and log the
profile id + product URI **server-side only**. The user-visible worst case is a
shorter caption, never a page reading `Sol undefined`.

Additionally, a **coverage report** in CI: for each configured profile, sample
N real products **per instrument** and report how many tiles resolve. A profile
whose tiles resolve 40% of the time is a config bug that no schema check can
catch — this is how you find it before users do. Broken out per instrument, the
same report is also the tool that answers "does any instrument need its own
config after all?" empirically, instead of by guesswork.

---

## 8. Where template resolution happens

**Recommendation: resolve in the API layer, per request, with a cache. Do not
resolve at index time, and do not add SSR to Atlas.**

The response contract for `/record`:

```jsonc
{
  "uri": "atlas:pds4:mars_2020:...",
  "presentation": {
    "caption": "Navcam Right — Sol 383, 12:50 LTST",
    "shortCaption": "Navcam R · Sol 383",
    "altText": "Navcam Right image of the Martian surface at Site 13, Drive 65",
    "citation": "Perseverance Navcam Right, urn:nasa:pds:mars2020_navcam_ops_calibrated:data:nrm_0383_... NASA Planetary Data System, mars2020_navcam_ops_calibrated, release 8. Retrieved from Atlas, 2026-08-20.",
    "links": [
      { "text": "Perseverance", "kind": "spacecraft", "value": "perseverance" },
      { "text": "Navcam Right", "kind": "instrument", "value": "NAVCAM_RIGHT" }
    ],
    "tiles": [
      { "label": "Sol",   "shortLabel": "Sol",   "value": "383" },
      { "label": "Local true solar time", "shortLabel": "LTST", "value": "12:50:44" },
      { "label": "Site",  "shortLabel": "Site",  "value": "13" },
      { "label": "Drive", "shortLabel": "Drive", "value": "65" }
    ]
  }
}
```

Strings only. **No field paths, no template source, no token names, no profile
id**, no "8 tokens resolved, 1 optional clause skipped" — the mockup shows that
provenance line and it must not ship. Note the tiles carry no `id` or path
either: the frontend renders a list of label/value pairs and cannot infer that
configuration exists, let alone what it says. `links` carries *resolved* text
plus a semantic kind so the frontend can render the mockup's underlined links
without knowing anything about templates.

Site and Drive appear as separate tiles here rather than one "Rover motion"
tile, per §4.5. There is **no `description`** — the prose lead is cut (§3.4),
so the caption is the only narrative string the page has. If prose is added
later it slots in as one more resolved string and changes nothing else in this
contract.

The frontend's entire job becomes: render `presentation.caption`, render
`presentation.tiles` in order, use `presentation.altText` on the `<img>`.
No conditional field logic in React at all.

### 8.1 Why not index time

Pre-computing resolved strings into the index is attractive until a template
changes:

- Any edit to a caption or to `vocabulary.json` requires reindexing the
  affected population. Since §4.1 puts one config in front of up to 23.4M
  products, the blast radius of a one-word change is a mission-sized reindex —
  the config consolidation makes index-time resolution *worse*, not better.
- It makes copy a *data migration*, so fixing a typo needs an indexing run
  and a deploy window. Iteration on wording is exactly what this design needs
  to be cheap.
- It couples Atlas's UI copy to a pipeline in a different team's repo.
- It bloats the index with per-language, per-variant strings if localisation
  ever appears.

The one thing index-time resolution genuinely buys is search over generated
text. With the prose description cut there is little text to search, so this
argument is weaker than it was; if it ever becomes a requirement, the right
shape is a narrow additional indexed field for search only, with display
strings still resolved at request time.

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
| **Desktop ≥ lg** | As mockup 1 minus the prose lead: `caption` + at-a-glance in the light panel, dark viewer beside it. At-a-glance in 3 columns. |
| **Tablet md** | Single column: viewer first (full width, ~55vh), then `caption`, then at-a-glance in **2 columns**. Tabs stay horizontal. |
| **Phone < sm** | Viewer first, full width, ~45vh. Then **`shortCaption`** — the phone default is the short variant, per the design intent. At-a-glance **1 column** as label/value rows; capped at 4 tiles with "Show all" revealing the rest. Tabs become scrollable. |

One simplification falls out of the prose cut (§3.4): with no paragraph, the
"short caption with a *More* disclosure that expands to the full description"
interaction disappears. Phones show `shortCaption`, larger screens show
`caption`, and there is no expand/collapse state to manage.

Details:

- **Viewer before metadata on narrow** — the image is why users are on the
  page. This matches mockup 8's bottom-drawer intent while keeping mockup 1's
  document flow, and avoids building a drawer component.
- **3 → 2 → 1 columns** for at-a-glance. At 375 px, two columns of
  "Local true solar time / 12:50:44" wrap badly; single-column rows read
  cleanly. Tile labels need a `shortLabel`, which the field catalog (§4.4)
  already carries per field — "LTST" instead of "Local true solar time" — so
  mobile costs no extra config.
- **No-browse products** (§6.1) skip the viewer block entirely on narrow
  rather than rendering an empty dark box above the fold; at-a-glance is
  promoted to first content.
- The `presentation.tiles` order comes from config, so the phone truncation to
  4 tiles uses the same authored priority as desktop — mission engineers
  control what survives truncation, and there is no second mobile-only
  ordering to maintain.

---

## 10. Implementation breakdown

Estimated in Devin sessions. Assumes the resolved-string API recommendation,
no derived fields (§4.5), normalized paths only (§4.6), and the two-layer config
from §4.1.

| # | Work | Sessions | Notes |
|---|---|---:|---|
| 1 | Config schema, two-layer resolution, field catalog, formatter allowlist | 1 | Pure logic, heavily unit-testable |
| 2 | Caption fragment renderer + constrained AST | 0.5 | Down from 1 — `{{path}}` substitution with fragment drop-out, no conditional syntax, no prose component |
| 3 | Validity gate + sentinel handling (§5) | 0.5 | Small but load-bearing |
| 4 | `vocabulary.json` — 57 instrument names + spacecraft/target | 0.5 | Bounded authoring; needs a data-engineer review pass |
| 5 | The 9 configs covering 95.5% of products | 0.5 | Down from 2 — each file is an ordered list of `gather.*` paths plus caption fragments (§4.7) |
| 5b | The remaining 16 configs (to 100%) | 0.5 | Can ship later; small, sparse missions |
| 6 | API integration: resolution endpoint, cache, `filter_path` slimming | 1.25 | **Cross-repo** — search proxy / Lambda is outside this repo. Down from 1.5: no sibling-count query (§6.2) |
| 7 | Frontend: rebuild Overview against `presentation`, dark surface, at-a-glance, links | 2 | Bulk of the visual work; unchanged |
| 8 | Mobile reflow + no-browse empty states | 0.75 | Down from 1 — no description disclosure to build (§9) |
| 9 | Validation: JSON Schema in CI, path-root check, mapping-snapshot check, golden fixtures, per-instrument coverage report | 0.75 | Down from 1 — no template parser to validate |
| 10 | Preview CLI for config authors | 0.5 | Replaces the "template studio" idea cheaply |
| 11 | Playwright coverage across profile shapes (rover, orbiter, sparse, no-browse) | 1 | Per `AGENTS.md` selector rules; no download clicks |
| | **Total** | **≈8** | Down from ≈12 in the first draft |

The reduction is items 2, 5, 6, 8 and 9, and all of it comes from the same three
decisions: no derived fields, no raw-label reads, and no config layer below
`mission × pds_standard`. Item 7 — the actual frontend rebuild — doesn't move,
and is now the largest single line item. That is the right shape: the cost
should be in the UI, not in the configuration system feeding it.

What is *not* in this table, and is the real remaining cost, is the upstream
normalization work in §6.5. None of it is in this repo, all of it is cheap per
field, and it is what turns thin profiles (`msl` PDS4, `mgs`) into full ones
without touching a line of frontend code.

Sequencing and risk:

- **Items 1–3 are the critical path** and are self-contained; they can land
  behind a flag before any visual change.
- **Item 6 is the schedule risk.** The search proxy is a different repo owned
  by a different team, so the API contract in §8 should be agreed *before*
  item 7 starts. If that coordination is slow, items 1–5 can be exercised
  client-side behind a flag — the record page already receives the full
  `_source` (§8.1), so a client-side prototype is possible with no backend
  change. That is a prototype path only, not the shipping architecture, since
  it would put config internals in the bundle.
- **Item 5 is no longer the dominant authoring cost**, which is the main
  practical change from the first draft. Nine files at ~20 lines each is a
  review-in-an-afternoon job, not a project. Most of the remaining authoring
  effort moved into item 4, which is a flat list of display names.
- **The MSL PDS4 normalization gap (§3.5) is the one item worth escalating to
  the indexing team in parallel**, and it should start now rather than after
  item 7. Tile drop-out makes the gap survivable — the page renders — but 6.91M
  products with no sol, site or drive is not a resting state, and under §4.6
  there is no presentation-layer route to fixing it.

---

## 11. Open questions

1. **Can `gather.landed_missions` / `gather.lighting_geometry` be populated for
   PDS4 surface products?** The highest-value question here. It is the only way
   sol, Site and Drive can appear on the 6.91M MSL PDS4 products at all under
   §4.5 and §4.6, and it improves search and sorting for every other consumer
   of the index at the same time.
2. **Who owns the search proxy** and what is their appetite for a
   `presentation` block on the record response? This determines whether the
   architecture in §8 is available or whether the first release is
   client-side-resolved behind a flag.
3. **Bundle- or collection-level DOIs** — do they exist in PDS registry
   metadata, and can Atlas cite them? Affects §6.4 wording.
4. **Can `gather.ancillary.group_id` be extended** beyond `mars_2020`? Decides
   whether the related-products tile is a per-mission special case or general.
5. **Is search over generated text a requirement?** With prose cut there is
   little to search, but if it is a requirement §8.1's narrow indexed-field
   carve-out needs designing in from the start.
6. **Who are the named config owners per mission?** The schema and validation
   only pay off if there is someone expected to author profiles for their
   mission. With only 25 files, a single owner for all of them is now a
   realistic alternative to per-mission ownership.
7. **Is caption-only acceptable, or is a prose lead wanted later?** The prose
   description is cut (§3.4) and the page leads with the caption. If a
   paragraph is wanted in a later release, §4.9's sentence-list is the cheap
   form; a template language with conditionals is not recommended at any point.
8. **Which of the cut fields are worth normalizing, in what order?** §3.4 lists
   the cost of each. Sequence is the cheapest (a scalar already in the label);
   PDS4 RMC has the largest product impact; processing level needs a
   PDS3/PDS4 vocabulary decision before it can be normalized at all.

---

## 12. What shipped

The implementation in this repo follows §4–§9 with three deliberate
differences, all driven by review feedback after the assessment was written.

### 12.1 Files

| Path | Purpose |
|---|---|
| `src/config/recordDetail/fields.json` | Field catalog (§4.4): label, shortLabel, format, unit, precision, numeric domain, per normalized path |
| `src/config/recordDetail/validity.json` | Global sentinel / null-ish rejection (§5) |
| `src/config/recordDetail/emptyStates.json` | No-browse copy variants (§6.1) |
| `src/config/recordDetail/mappingSnapshot.json` | 171 `gather.*` / `archive.*` leaf paths from the live `_mapping`, so validation can fail on a path the index doesn't have |
| `src/config/recordDetail/profiles/*.json` | `_default` plus mission and mission.`pds_standard` profiles |
| `src/config/recordDetail/instances/raws.json` | RAWS app-instance override (§12.3) |
| `src/core/recordPresentation/` | Resolver, formatters, validity gate |
| `src/pages/Record/Content/Views/Overview/Overview.js` | The redesigned Overview |
| `tests/unit/record-presentation*.spec.js` | Config validation + golden fixture assertions |
| `tests/fixtures/records/*.json` | Seven real sampled records (rover PDS3/PDS4, orbiter, sentinel-bearing, no-browse, sparse) |

Ten mission profiles ship rather than 25: `cas`, `clem`, `mars_2020`, `mer`,
`mess`, `mgs`, `mro`, `msl.pds3`, `msl.pds4`, `ody`, plus `_default`. That is
the 95.5% set from §4.1 plus the two MSL standards split out; the remaining
missions render from `_default` today and get a profile when someone wants one.

### 12.2 Separators are structural, not typed into fragments

§4.9 wrote caption fragments with their own punctuation
(`"— Sol {{…}}"`). Shipped fragments carry no punctuation at all and the
resolver joins the surviving ones with ` · `. Reason: a leading dash belongs to
the fragment *after* the one that dropped, so an MSL PDS4 record whose
instrument path is missing rendered `— Mars`. With structural separators, any
subset of fragments dropping still reads correctly. A profile can override the
separator; `altText` and `citation` join with a space since they are prose.

### 12.3 Tiles carry an icon and an optional sub-line

The mockup's at-a-glance cards are three lines — icon + label, value, and a
smaller secondary line (`Sol 1279 / Ls 334.8°`, `11:45 / LMST 12:36`). Shipped
tiles reproduce all three without breaking the normalized-paths-only rule:

- Every catalogued field carries an `icon` name from
  `src/config/recordDetail/icons.json`, mapped to a MUI component in
  `src/pages/Record/Content/Views/Overview/tileIcons.js`. Names are an
  allowlist, not a dynamic import, and validation fails on an unknown one.
- A profile tile entry is either a path string or `{ path, sub }`, where `sub`
  is a second normalized path rendered on the small line. It reads that field
  through the same catalog and validity gate, prefixed by the field's
  `microLabel` (`Ls`, `LMST`, `drive`) or its `shortLabel`. A missing or
  sentinel `sub` value drops the sub-line only; the tile itself survives.
- Units are unchanged — they come from the catalog and are already part of the
  formatted value.

So `{ "path": "…rmc_site", "sub": "…rmc_drive" }` renders the mockup's
"Site 39 / drive 1469" card as one tile instead of two, while a record with no
drive still shows Site. Pairing is only a display choice per profile; the paths
stay direct field reads.

### 12.4 An app-instance layer above mission

Resolution is `_default → mission → mission.pds_standard → instance mission →
instance instrument`, one layer more than §4.3. Atlas and RAWS are already
separate app instances (`src/core/appConfig.js`, `getAppInstanceKey()`), and
RAWS needs a different M20 Navcam tile list and caption than Atlas without
forking the shared mission profiles.

`instances/raws.json` is the single worked example: `mars_2020` with
`NAVCAM_LEFT` / `NAVCAM_RIGHT` overrides. It is intentionally the only instance
file — RAWS has no data in this index yet, so it exists to pin the mechanism,
not to serve traffic.

Note the asymmetry: the mission layer exists because field *availability*
differs, the instance/instrument layer exists because *editorial preference*
differs. Instrument is still not an availability axis (§4.1). RAWS also sets
`enableRecordCitation: false`, so the citation line is Atlas-only.

### 12.5 Resolution runs client-side, for now

§8 recommends the search proxy return resolved strings. The proxy is a
different repo, so resolution ships as a self-contained module with no React,
Redux or DOM dependency, consumed by the Overview at render time. Lifting it
into the API Lambda means moving the directory and swapping the call site; the
public contract (`caption`, `shortCaption`, `altText`, `citation`, `tiles`,
`priorityTiles`, `emptyState`) is already the payload §8 proposes, and nothing
outside the module ever sees a path or a template.

### 12.6 Validation

`npm run test:unit` runs the checks §7 asks for without a browser or a server:
every catalogued path exists in the mapping snapshot, every tile path and
caption token is catalogued, every formatter name is real, every empty-state
key resolves, every profile can still fill its `maxTiles` after drop-out, and
no fragment uses conditional syntax. The fixture specs assert resolved output
against real records, including that the resolved payload contains neither
`gather.` nor `{{`.

### 12.7 Fixes from the first browser pass

Running the page against real records surfaced four defects, all fixed:

- **No-browse detection.** `.IMG` products with no browse asset fell through to
  the source product URL, so MESSENGER MDIS and MSL PDS4 records showed
  OpenSeadragon's legacy "no browse image" panel instead of the configured
  empty state. The viewer now reports `open-failed` up to the Overview, which
  swaps in the configured empty state.
- **"View full label" was invisible** — an outlined button with no explicit
  colour. It now takes its colour explicitly from the grey swatches.
- **Citation punctuation and overflow.** Citation fragments carried their own
  commas, so a dropped fragment left a dangling comma; they are now
  punctuation-free and joined with `, ` (the §12.2 rule, applied to citations
  too). The block wraps instead of scrolling horizontally.
- **Tile labels truncated on desktop.** Tiles use `shortLabel` at every
  breakpoint, with the full label as the tooltip, matching the mockup's card
  titles ("Local time", "Sun elev.").

Also `gather.ancillary.eye_type` moved off the camera icon (shared with
Instrument) onto its own.

### 12.8 The record body is dark, per the mockup

The Overview renders on the mockup's dark surface, not Atlas's light one: the
metadata column is `grey800` with `grey850` tiles, labels `grey400`, values
`grey0`; the viewer column stays `grey900`. The shell above it (topbar,
branding, icon rail, title bar, tabs) is untouched.

### 12.9 The full metadata panel and the caption card

A second review pass restored the parts of the mockup's panel that the first
implementation left out:

- **Caption card.** The strip below the viewer became the mockup's floating
  card: a chip row, a bold title, then the prose caption, plus *Copy caption*.
  All three come from profile keys — `captionChips` (a fragment per chip),
  `captionTitle`, `caption` — resolved by the same fragment renderer, so a chip
  or clause whose path is missing drops whole. Prose profiles set
  `"separator": ", "` so the caption reads as a sentence rather than a
  `·`-joined list. Phones show title + short caption only.
- **About this product.** The mockup's prose block is back (it was cut in §3.4
  and restored in review): a profile `description` list rendered above the
  tiles. Unlike captions, description fragments are whole sentences joined with
  a space, so a clause whose path is missing drops without leaving a fragment
  of a sentence behind — an MSL PDS4 record with no normalized instrument opens
  on "It observes Mars." rather than a broken lead. Hidden under `md`, where
  the short caption carries the page.
- **Field filter.** One input filters every row in the panel by label or value,
  with the live field count in its placeholder. Filtering expands all sections
  so a match is never hidden behind a collapsed header. A **Raw names** toggle
  beside it adds the raw-label section; with it off, every visible row carries a
  catalogued label, so `gather.*` paths stay out of the UI by default.
- **Collapsible sections.** `sections.json` groups catalogued normalized paths
  into `identification`, `observation`, `geometry_surface`,
  `geometry_orbital` and `files`; a profile lists the ids it wants, so an
  orbiter never renders a surface-geometry section. Rows resolve through the
  same catalog and validity gate as tiles, so absent fields — and then empty
  sections — drop out. Identification and Observation open on load, the rest
  start collapsed. Behind **Raw names**, a final **All label fields** section
  flattens `pds3_label`/`pds4_label`, skipping object-valued keys so no row
  renders `[object Object]`. Every row has a copy-value button.

  Note `ES_PATHS.pds4_label` is shadowed in `constants.js` by a nested object of
  the same name, so `getIn` with it returns the whole record. This view spells
  the two label paths out locally; `ProductLabel.js` still uses the shadowed
  constant and is worth a separate look.
- **Action bar.** Download (`SplitButton` over the record's related products),
  Add to cart, Copy citation, View full label and copy-link, pinned below the
  scrolling panel. Download and cart reuse the same
  `streamDownloadFile`/`addToCart` calls as the title bar via
  `src/core/recordDownloads.js`; the title bar hides its download button under
  `md`, so this is also the only download affordance on a phone. The bar is
  `position: sticky` so it stays reachable on a phone without scrolling past the
  whole field list.

Description fragments open on the product type rather than an article
(`EDR image from …`, not `a EDR image from …`), since product types are
acronyms and an a/an rule would be a derived field.

No template authoring surfaces here: rendered output only, no template source,
profile names, token counts or edit affordances, per §3's constraint as
clarified in review — the rendered *result* of a template is fine in the UI, an
in-page template editor is not.

### 12.10 Viewer chrome, and the version row

- **Version is an Identification row.** The mockup puts the PDS4 version in the
  Identification section — value plus an `N versions` affordance — not above the
  panel, so the selector moved into that section as a normal row: it is counted
  by the field filter and reachable by searching "version". PDS3 records and
  single-version products render no selector.
- **The viewer controls are dark**, like the mockup's: `grey700` buttons with
  `grey150` icons across every OpenSeadragon view, since they all sit over a dark
  image surface.

Moving the version control surfaced a real bug: `Record.js` watched
`location.href`, which react-router's location object does not have, so the
record never refetched when only the `uri` query param changed — picking a
version updated the URL and left the previous product on screen. It now watches
`location.search`.

### 12.11 At-a-glance order, LMST, and whole rows

- **LMST is the primary time-of-day field**, LTST demoted to its sub-line
  (`LMST 14:19:46` / `LTST 14:28:56`), and the caption chips and prose clauses
  now read LMST. Landed profiles (`mars_2020`, `msl.pds3`, `mer`, the RAWS
  override) all follow.
- **Landed tile order is the requested 3×3+**: Mission · Spacecraft · Instrument
  / Sol · Site · Drive / LMST · solar el(az) · instrument el(az) / start time ·
  Eye · product type. Site and Drive are separate tiles now rather than one tile
  with a sub-line, and orbiter profiles gained the same leading Mission ·
  Spacecraft · Instrument row.
- **The grid never renders a partly filled row.** Profiles cap at 12 tiles (9
  for the orbiters), and the Overview trims the resolved list to a multiple of
  the active column count — 3 wide, 2 between `sm` and `lg`, 1 on phones — so
  drop-out can shrink the block by a whole row but never leave a ragged one.
- **Mission codes resolve through Atlas's own display names.** With Mission as
  the first tile, `prettify('mgs')` rendering `Mgs` became visible, so the
  `vocabulary` formatter now looks up a `vocabulary: "mission"` value in
  `DISPLAY_NAME_MAPPINGS` and drops the trailing gloss (`msl` →
  `MSL - Mars Science Laboratory` → `MSL`). Spacecraft is deliberately excluded:
  the same map turns `curiosity` into `MSL - Curiosity`, where the tile wants
  `Curiosity`.

### 12.12 The filename breakdown

The record title bar renders the source product filename as labelled,
colour-coded segments with a tooltip per segment, from a per-mission naming
convention config. Mars 2020 ships first.

- **Config**: `src/config/recordDetail/filenames/<mission>.json`, keyed in
  `filenameSpecs` by `<mission>` or `<mission>.<pds_standard>`, so a mission can
  ship one spec per PDS standard when the conventions diverge. Missions with no
  spec render the plain filename — nothing else changes for them.
- **Grammar**: fixed character positions, per the M2020 Camera Data Products SIS
  (JPL D-99960) Table 18-1: a 54-character stem plus `.` plus a 3-character
  extension, 20 fields — instrument, colour/filter, special processing, sol,
  venue, spacecraft clock, mesh, milliseconds, product type, geometry, thumbnail,
  site, drive, sequence ID, camera-specific, downsample, compression, producer,
  version, extension.
- **Meanings** resolve in three steps: exact code (`NR` → Navcam Right), then a
  code group (the SIS's RDR product-type families, e.g. 20 zenith-scaled colour
  codes sharing one meaning), then ordered regexes for the ranged fields
  (`0818` → `Sol 818`, `LL` → lossless LOCO, `I3` → ICER at 3 bits per pixel).
  An unrecognized code keeps its label, raw value and field description but
  claims no meaning, so new product types degrade instead of lying.
- **Fallback**: `parseFilename` returns `null` — plain text — when no spec
  matches the mission, or when the filename fails the spec's regex. That is what
  keeps the M2020 **mosaic** and **terrain** conventions (both distinct from the
  single-frame one, SIS §18) safe until they get their own specs.
- **Presentation**: each segment is a `<button>` inside an MUI `Tooltip`, so the
  breakdown works on hover, on keyboard focus and on touch; the tooltip carries
  field name, raw value, decoded meaning and description, and the group exposes
  the whole filename as its accessible name. Colours are named in the config
  (`blue`, `teal`, …) and mapped to values readable on the light title bar in
  `FilenameBreakdown`, so the config never carries hex.

The vocabulary is deliberately partial: the exact codes are the common ones plus
every RDR family, and the parser is what guarantees the rest still render.

One mockup element is still absent and is a product decision, not an
implementation gap: the **Related Products tab** (no such tab exists in
`Content.js` today — the mockup shows one). The mockup's viewer toolbar
(Caption / Overlays / Measure / Sequence) is also unbuilt; Sequence has no
normalized path (§3.4).

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
  This is the number of distinct field-availability shapes, **not** the number
  of config files — see §4.1.
- Config-count sizing (§4.1): for each of the 25 mission × `pds_standard`
  populations, a `filters` aggregation of `exists` over a 38-field candidate
  pool, run once for the population and once per instrument within it (91
  instruments total), with `track_total_hits: true` throughout. A field counts
  as present for an instrument at ≥95% of that instrument's products and absent
  at ≤5%; "instruments disagree" means one instrument is above the first
  threshold and another below the second. Instruments contributing under
  max(1000 products, 0.1% of the population) were excluded to keep long-tail
  noise out of the union.
- Documents inspected in full: M2020 MCZ_RIGHT RNR, M2020 NAVCAM_RIGHT TDR,
  MSL MAST_LEFT (both PDS3 and PDS4), MER PANCAM, MRO HiRISE, Cassini,
  MGS MOC `m0400821.imq`.
- Asset resolution checked with `curl -L` against
  `https://pds-imaging.jpl.nasa.gov/api/data/<uri>::<release_id>`.
- No write operations were performed against any PDS service, and no download
  affordances were exercised.
