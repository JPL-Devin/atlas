# Atlas IV API

A Node.js / Express REST API that sits between the Atlas IV React frontend
and Elasticsearch. Historically the frontend issued Elasticsearch DSL queries
directly through a public proxy; this layer introduces a typed, versionable
HTTP surface so that the frontend can stay decoupled from the data store and
authentication / authorization can be added later in a single place.

## Quick Start

```bash
cd api
cp .env.example .env
# Edit .env to point ELASTICSEARCH_URL at your cluster.
npm install
npm start
```

The server listens on `http://localhost:3001` by default.

## Configuration

All configuration is read from environment variables (or an `api/.env` file).
See `.env.example` for the full list. Notable variables:

| Variable                                | Description                                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| `ELASTICSEARCH_URL`                     | URL of the Elasticsearch cluster (or proxy).                     |
| `ELASTICSEARCH_INDEX`                   | Primary index name (default `atlas`).                            |
| `ELASTICSEARCH_USERNAME` / `_PASSWORD`  | Optional basic-auth credentials.                                 |
| `ELASTICSEARCH_API_KEY`                 | Optional API key (takes precedence over basic auth).             |
| `ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED` | Set to `false` for self-signed certs in development.             |
| `PORT`                                  | API port (default `3001`).                                       |
| `CORS_ORIGIN`                           | Comma-separated list of origins allowed to call the API.         |
| `MAX_BULK_DOWNLOAD_COUNT`               | Cap on the number of products allowed in a single cart download. |

## Endpoints

| Method | Path                  | Description                                                         |
| ------ | --------------------- | ------------------------------------------------------------------- |
| GET    | `/health`             | Liveness probe.                                                     |
| GET    | `/api`                | Index of available endpoints.                                       |
| GET    | `/api/search`         | Typed search with filters, paging, and bounding-box geo filtering.  |
| POST   | `/api/search`         | Pass-through for raw Elasticsearch DSL bodies.                      |
| POST   | `/api/search/scroll`  | Initialise / continue / clear scroll & PIT pagination.              |
| GET    | `/api/record/:id`     | Fetch a single product document by its Elasticsearch `_id`.         |
| GET    | `/api/missions`       | List supported missions and their associated planets / moons.       |
| GET    | `/api/missions/:id`   | Single mission detail.                                              |
| GET    | `/api/archive`        | List archive entries under a parent URI (PDS bundle/collection).    |
| POST   | `/api/cart/download`  | Generate a `curl`/`wget`/`csv`/`txt`/`zip` artifact from cart IDs.  |

### `GET /api/search`

Query parameters:

- `keyword` — free-text query string (Lucene syntax).
- `mission`, `instrument`, `target`, `spacecraft`, `productType` — comma-separated terms filters.
- `bbox` — `minLon,minLat,maxLon,maxLat` geo bounding box on `gather.common.geo_location`.
- `startTime`, `endTime` — ISO timestamps applied to `gather.time.start_time`.
- `page` (default `1`), `size` (default `25`, max `500`).
- `sortField`, `sortOrder` (`asc` | `desc`).

Response:

```json
{
    "page": 1,
    "size": 25,
    "total": 12345,
    "results": [{ "id": "...", "score": 1.0, "source": { ... } }]
}
```

### `POST /api/cart/download`

```json
{
    "ids": ["abc", "def"],
    "format": "curl",
    "filename": "atlas-cart"
}
```

Supported formats: `curl`, `wget`, `csv`, `txt`, `zip`. The `zip` format
returns a JSON manifest the frontend's StreamSaver pipeline can use to drive
the actual binary streaming download.

## Docker

```bash
docker build -t atlas-api -f api/Dockerfile api
docker run --rm -p 3001:3001 --env-file api/.env atlas-api
```

## Pointing the React app at this API

In the repo-root `.env`, set:

```
REACT_APP_DOMAIN = "http://localhost:3001/api"
```

The existing frontend will continue to work because `POST /api/search`
accepts the raw Elasticsearch DSL bodies it produces today; the typed REST
endpoints can be adopted incrementally.
