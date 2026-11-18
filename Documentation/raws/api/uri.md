---
sidebar_position: 1
---

# URI

Planetary Raws identifies files using URIs.

## File URIs

```text
urn:raws:<mission>:<spacecraft>:/<path>
```

File URIs appear in `gather.uri` and `related[].uri`. Use these identifiers with
the [Data Access API](./data-access).

```text title="Example file URIs"
urn:raws:m20:perseverance:/sol02007/WSM_2007_0845129080_000ECM_N0911496MEDA00000_0000LUJ01.png
urn:raws:msl:curiosity:/sol05043/CR0_845178861EDR_F1251194CCAM01043M_.JPG
urn:raws:insight:insight:/sol01316/D000M1316_713370223EDR_F0000_0817M_.JPG
```

Where present in these paths, the sol directory is `sol` plus a five-digit,
zero-padded number, such as `sol02007`. Cassini and Psyche paths have no sol directory.

Mission and spacecraft names are lowercase; see [Missions and Spacecraft](../standards/missions-and-spacecraft).

Raws does not use releases. Do not append `::release_id` to the URI.
