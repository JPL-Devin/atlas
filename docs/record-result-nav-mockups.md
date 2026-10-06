# Record page result navigation — mockups

UI mockups (not an implementation) of previous/next navigation through search
results from the Record (product detail) page. Everything is driven by fixture
data; no Redux paging logic is touched.

## Trying the mockups

Add `resultNav` (and optionally `resultNavState`) to any record URL:

```
/record?uri=<uri>&resultNav=a                        # Variant A, middle of results
/record?uri=<uri>&resultNav=b&resultNavState=first
/record?uri=<uri>&resultNav=c&resultNavState=loading
```

| Param | Values |
|---|---|
| `resultNav` | `a`, `b`, `c` — turns the mockup on. Absent → Record page is unchanged. |
| `resultNavState` | `middle` (default), `first`, `lastLoaded`, `loading`, `none` |

A floating "Result nav mockup" panel (bottom right) switches variant and state
in place without reloading. Prev/next step through the fixture; from
`lastLoaded`, Next simulates a 1.5 s page fetch and then advances into the next
page.

Fixture: 1,284 total results, 100 per page (`resultsPerPage`'s default), first
page loaded. Neighbor titles are synthetic Mars 2020 Navcam filenames.

| State | Position | Behavior |
|---|---|---|
| `first` | 1 of 1,284 | Prev disabled |
| `middle` | 42 of 1,284 | Both enabled, neighbor titles on hover |
| `lastLoaded` | 100 of 1,284 | Next enabled but has no loaded neighbor to preview; clicking loads page 2 |
| `loading` | 100 of 1,284 | Next shows a spinner, `aria-busy`, disabled |
| `none` | — | No result context (e.g. opened from CartView, FileX Preview, a shared link): nav hidden, page looks as today |

## Variants

Screenshots are in `docs/images/record-result-nav/` (`lg-*` at 1440 px, `md-*`
at 900 px).

### A — actions row

Prev/next outlined buttons with "Result N of M" between them, first in the
PanelHeader actions row (before `extraActions`). The row is already full at the
770 px panel width, so at `lg` the Archive Explorer and Copy Link buttons drop
to icon-only (their tooltips already name them). "Result" is dropped below
`lg`.

- Pro: no extra vertical space; reads as another record action.
- Con: competes with cart/download for the row; forces icon-only secondary
  actions; neighbor titles only via tooltip.

### B — slim bar above the title row

A 28 px grey bar above the title: `‹ Prev`, `42 / 1,284 search results`,
`Next ›`. Hovering an edge shows the neighbor's filename. Loading shows
"Loading" + spinner at the Next edge.

- Pro: clearly scoped to "search results"; biggest click targets; doesn't touch
  the actions row.
- Con: +28 px of chrome on every record opened from search; a floating
  edge-chevron treatment over the viewer was considered but would collide with
  the OpenSeadragon controls on the viewer's left edge.

### C — breadcrumb near the back affordance

`‹ Prev result | Back to results | Next result ›` above the filename, in the
title block. "Back to results" takes over from the title row's back chevron,
which is hidden in this variant to avoid two "back" controls.

- Pro: lightest visual weight; groups "where did I come from" with "where can I
  go next".
- Con: small targets; hides the `?back=page` / "return to search" chevron, so
  its semantics are folded in: with a live `back=page` the middle link reads
  "Back" and returns to the previous page (e.g. FileX) instead of search.

## Files

- `src/pages/Record/Content/ResultNav/resultNavFixtures.js` — fixture + presets
- `src/pages/Record/Content/ResultNav/ResultNavMockup.js` — context provider,
  `useResultNav()`, URL param parsing, simulated page load
- `ResultNavActions.js` (A), `ResultNavBar.js` (B), `ResultNavBreadcrumb.js` (C)
- `ResultNavMockupSwitcher.js` — floating variant/state switcher
- `PanelHeader.js` renders the active variant; `Record.js` mounts the provider

## Open questions

### Result context: how does the Record page know its position?

Today only `?uri=` (and `?back=page` from FileX) is passed. Options:

1. Read the live Redux `results` list and find the record's index by `uri`.
   Works only while the search state is in memory — lost on reload / new tab.
2. Pass the index in the URL (`&result=41`). Survives reload but can go stale
   if the query or sort changed, and would need stripping from "Copy Link"
   (as `back` is today).
3. Hybrid: `recordClickHandlers` sets a transient "opened from results" marker
   (history state, not the URL) and the page looks up the index in Redux.
   Anything without the marker (Cart, FileX, MapListener, shared links) gets the
   `none` state.

Either way, `resultSorting` / filters changing while on a record must
invalidate the context.

### Push vs. replace history semantics

- **Push** each step: Back walks through every record visited, so returning to
  search after browsing 30 results takes 30 Backs — unless "Back to results"
  navigates directly (as Variant C implies).
- **Replace** each step: Back returns straight to search, matching the
  current single-hop mental model, but the browser can't step back to the
  previous record. This also matches how the version selector in
  `Overview.js` already uses `replace` to preserve FileX's `back=page`.
- `canGoBack` in `PanelHeader` relies on `window.history.state.idx > 0`;
  with push, "Back" in the title row would mean "previous record", not
  "search". Needs a decision before Variant A/B keep the existing chevron.

### Prefetching on page boundaries

At the last loaded result the next item doesn't exist yet (`search(page)` is
lazy). Options: (a) fetch on click and show the loading state (mocked here);
(b) prefetch `page + 1` when the user lands within N of the boundary so Next
is instant; (c) fetch a single-item "peek" (`from = index + 1, size = 1`) for
the tooltip without loading a full 100-row page. Prefetching also has to
append to Redux `results` so the list/grid shows the new rows on return.
Also: what happens when Next is clicked while a page fetch is already in
flight from the results view?

### Scroll-restore via `setResultViewIndex`

`ListView`/`GridView` restore scroll to `getResultViewIndex()` on return.
After stepping from result 42 to 57 on the Record page, returning should
probably land on 57, so each step should call `setResultViewIndex(index)`.
TableView imports the same helpers — confirm it restores identically. If a
new page was loaded from the Record page, the restored index must be inside
the now-longer list.

### Responsive / collapsed layout below `lg`

Below `lg` the PanelHeader stacks above the image (`order: -2`) and spans the
full width, so Variant A fits without compacting (see `md-a-middle.png`).
Below `md` `LabelActions` are dropped and a phone-width row may still
overflow — A likely needs icon-only prev/next with the count moved elsewhere.
B scales best on phones (full-width bar, large targets); C's text links become
small touch targets. Swipe left/right on the image as a mobile-only
complement is worth considering but conflicts with OpenSeadragon panning.

### Other

- Keyboard shortcuts (e.g. `[` / `]` or Alt+←/→); `Ctrl+Z` is already
  "back to search".
- Whether the counter should show loaded vs. total ("100 of 1,284 — 100
  loaded").
- Analytics/perf: each step re-runs `searchRecordByURI` plus the versions
  query; rapid stepping should cancel in-flight record fetches.
