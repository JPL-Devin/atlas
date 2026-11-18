---
sidebar_position: 3
---

# Search

Raws products are queried using Elasticsearch DSL at:

```text
https://pds-imaging.jpl.nasa.gov/api/search/raws-test/_search
```

## Look up a file

```sh
curl 'https://pds-imaging.jpl.nasa.gov/api/search/raws-test/_search' \
  -H 'Content-Type: application/json' \
  --data-raw '{"query":{"term":{"gather.uri":"urn:raws:m20:perseverance:/sol01729/ZR0_1729_0820448000_519EBY_N0830000ZCAM00091_1100LMJ01.png"}},"size":1}'
```

## Look up a product

Replace `<product_id>` with the mission product identifier. The top-level `uri`
is a product URN, whereas `gather.uri` is the file URI used for data access.

```json title="Query body"
{
  "size": 1,
  "query": {
    "term": {
      "uri": "urn:raws:m20:<product_id>"
    }
  }
}
```

The same product URN can be looked up by `_id` using an `ids` query:

```json
{"query":{"ids":{"values":["urn:raws:m20:<product_id>"]}},"size":1}
```

:::note Live index availability
The live endpoint returned `"Index raws-test not available"` during verification.
A real product response could not be retrieved; the queries above describe the
identifier fields, not a verified live result.
:::
