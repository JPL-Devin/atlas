---
sidebar_position: 3
---

# Search

Raws files are queried using Elasticsearch DSL at:

```text
https://pds-imaging.jpl.nasa.gov/api/search/raws-test/_search
```

## Look up a file

```sh
curl 'https://pds-imaging.jpl.nasa.gov/api/search/raws-test/_search' \
  -H 'Content-Type: application/json' \
  --data-raw '{"query":{"term":{"gather.uri":"urn:raws:m20:perseverance:/sol02007/WSM_2007_0845129080_000ECM_N0911496MEDA00000_0000LUJ01.png"}},"size":1}'
```

An MSL file can be looked up with the same field:

```json title="Query body"
{
  "size": 1,
  "query": {
    "term": {
      "gather.uri": "urn:raws:msl:curiosity:/sol05043/CR0_845178861EDR_F1251194CCAM01043M_.JPG"
    }
  }
}
```
