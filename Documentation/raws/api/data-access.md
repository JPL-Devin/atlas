---
sidebar_position: 2
---

# Data Access

The Data Access API maps a Raws file [URI](./uri) to its data location.

## Usage

```text
https://pds-imaging.jpl.nasa.gov/api/data/{uri}{:resize?}
```

- **uri:** The file URI from `gather.uri` or `related[].uri`, not the product URI.
- **resize:** Optional image resize suffix: `:xs` (128x128), `:sm` (256x256),
  `:md` (512x512), or `:lg` (1024x1024). Resized images are returned as WebP.

Raws has no release suffix.

```text title="Example URLs"
https://pds-imaging.jpl.nasa.gov/api/data/urn:raws:m20:perseverance:/sol02007/WSM_2007_0845129080_000ECM_N0911496MEDA00000_0000LUJ01.png:md
https://pds-imaging.jpl.nasa.gov/api/data/urn:raws:msl:curiosity:/sol05043/CR0_845178861EDR_F1251194CCAM01043M_.JPG
```
