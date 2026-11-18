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

```text title="Example URL"
https://pds-imaging.jpl.nasa.gov/api/data/urn:raws:m20:perseverance:/sol01729/ZR0_1729_0820448000_519EBY_N0830000ZCAM00091_1100LMJ01.png:md
```

:::note Availability
The unresized example returned HTTP 404 during documentation verification.
Use Search to obtain a currently available file URI before requesting data.
:::
