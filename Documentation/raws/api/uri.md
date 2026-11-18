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

```text title="Example file URIs"
urn:raws:m20:perseverance:/sol02007/WSM_2007_0845129080_000ECM_N0911496MEDA00000_0000LUJ01.png
urn:raws:msl:curiosity:/sol05043/CR0_845178861EDR_F1251194CCAM01043M_.JPG
urn:raws:insight:insight:/sol01316/D000M1316_713370223EDR_F0000_0817M_.JPG
```

Where present in these paths, the sol directory is `sol` plus a five-digit,
zero-padded number, such as `sol02007`.

Mission and spacecraft names are lowercase; see [Missions and Spacecraft](../standards/missions-and-spacecraft).

## Product / document URIs

```text
urn:raws:<mission>:<product_id>
```

The top-level `uri` and `_id` identify the product document, not a file path.
Use [Search](./search) to find a product and its file URI.

```text title="Example document URIs"
urn:raws:m20:NLG_1932_0838463126_112ECM_N0894246NCAM00500_00_2I4J
urn:raws:msl:NLB_780000000EDR_F0000000NCAM00500M1
urn:raws:insight:D000M0010_597602286EDR_F0000_0461M_
urn:raws:cassini:W1234567890_1
urn:raws:psyche:psy_mi_a_0001
```

MSL mosaics use `urn:raws:msl:mosaic:<product_id>`:

```text
urn:raws:msl:mosaic:N_A000A0060XILT005CYLTSG0104_DRIVEM1
```

Raws does not use releases. Do not append `::release_id` to either URI format.
