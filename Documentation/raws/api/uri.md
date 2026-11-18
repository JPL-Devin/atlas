---
sidebar_position: 1
---

# URI

Planetary Raws distinguishes file identifiers from product (document) identifiers.

## File URIs

```text
urn:raws:<mission>:<spacecraft>:/<path>
```

File URIs appear in `gather.uri` and `related[].uri`. Use these identifiers with
the [Data Access API](./data-access).

```text title="Example file URI"
urn:raws:m20:perseverance:/sol01729/ZR0_1729_0820448000_519EBY_N0830000ZCAM00091_1100LMJ01.png
```

Mission and spacecraft names are lowercase; see [Missions and Spacecraft](../standards/missions-and-spacecraft).

## Product / document URIs

```text
urn:raws:<mission>:<product_id>
```

The top-level `uri` and `_id` identify the product document, not a file path.
Use [Search](./search) to find a product and its file URI.

Raws does not use releases. Do not append `::release_id` to either URI format.
