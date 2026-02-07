# DataHub

Centralized metadata hub for dataset management across multiple hosts.

## Features

- **Dataset Registry**: Track datasets from multiple sources (Confluence, Jira, Notion, GitHub, Slack, etc.)
- **Full-Text Search**: PostgreSQL-powered search with relevance ranking
- **Fuzzy Matching**: Typo-tolerant search using trigram similarity
- **Next.js**: Single application handling both UI and API
- **Multi-Host Support**: Track which host stores each dataset

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   DataHub                       │
│                                                 │
│  ┌──────────────┐     ┌──────────────────────┐  │
│  │  PostgreSQL  │◄────│  Next.js             │  │
│  │  (metadata   │     │  (UI + API routes)   │  │
│  │   + search)  │     │  :3000               │  │
│  └──────────────┘     └──────────────────────┘  │
│                               ▲                 │
└───────────────────────────────┼─────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    ┌────┴────┐           ┌─────┴─────┐         ┌──────┴──────┐
    │collector│           │  indexer  │         │other service│
    └─────────┘           └───────────┘         └─────────────┘
```

## Quick Start

### Local Development

1. **Start PostgreSQL:**

```bash
docker run -d \
  --name datahub-postgres \
  -e POSTGRES_DB=datahub \
  -e POSTGRES_USER=datahub \
  -e POSTGRES_PASSWORD=datahub \
  -p 5432:5432 \
  postgres:16-alpine
```

2. **Install dependencies and run migrations:**

```bash
cd datahub
npm install
DATABASE_URL=postgresql://datahub:datahub@localhost:5432/datahub npm run db:migrate
```

3. **Start the app:**

```bash
DATABASE_URL=postgresql://datahub:datahub@localhost:5432/datahub npm run dev
```

4. Open http://localhost:3000

### Kubernetes Deployment

1. **Create secrets** (edit `k8s/secrets.yaml` first!):

```bash
kubectl apply -f k8s/secrets.yaml
```

2. **Deploy PostgreSQL:**

```bash
kubectl apply -f k8s/postgres.yaml
```

3. **Run migrations** (one-time, from a pod with DB access):

```bash
DATABASE_URL=postgresql://... npm run db:migrate
```

4. **Build and deploy:**

```bash
cd datahub
docker build -t your-registry/datahub:latest .
docker push your-registry/datahub:latest
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## Project Structure

```
datahub/
├── k8s/
│   ├── postgres.yaml        # PostgreSQL StatefulSet
│   ├── secrets.yaml         # Credentials template
│   ├── deployment.yaml      # App Deployment
│   └── ingress.yaml         # Ingress routing
├── package.json
├── Dockerfile
├── scripts/
│   └── migrate.mjs          # Database migrations
└── src/
    ├── app/
    │   ├── api/             # Next.js API routes
    │   │   ├── datasets/
    │   │   └── health/
    │   ├── datasets/[id]/
    │   └── page.tsx         # Dashboard
    ├── components/
    └── lib/
        ├── api.ts           # Client-side API helpers
        └── db.ts            # PostgreSQL connection
```

## API Reference

### Authentication

All API endpoints require authentication using an API key. Include your API key in the `X-DataHub-API-Key` header:

```bash
curl -H "X-DataHub-API-Key: dh_your_api_key_here" http://localhost:3000/api/datasets
```

**Managing API Keys:**

```bash
# Issue a new API key
npm run apikey:issue <key-name>

# List all API keys
npm run apikey:list

# Revoke an API key (marks as inactive)
npm run apikey:revoke <key-name-or-id>

# Delete an API key permanently
npm run apikey:delete <key-name-or-id>
```

### Endpoints

| Method   | Endpoint                     | Description                   |
| -------- | ---------------------------- | ----------------------------- |
| `GET`    | `/api/datasets`              | List all datasets (paginated) |
| `POST`   | `/api/datasets`              | Create a new dataset          |
| `GET`    | `/api/datasets/{id}`         | Get a specific dataset        |
| `PATCH`  | `/api/datasets/{id}`         | Update a dataset              |
| `DELETE` | `/api/datasets/{id}`         | Delete a dataset              |
| `GET`    | `/api/datasets/search?q=...` | Search datasets               |
| `GET`    | `/api/datasets/stats`        | Get aggregate statistics      |
| `GET`    | `/api/health`                | Health check                  |

### Search Parameters

| Parameter     | Type   | Description                              |
| ------------- | ------ | ---------------------------------------- |
| `q`           | string | Search query (required)                  |
| `source_type` | string | Filter by source type                    |
| `status`      | string | Filter by status                         |
| `owner`       | string | Filter by owner                          |
| `tags`        | string | Comma-separated tags                     |
| `fuzzy`       | bool   | Enable fuzzy matching (default: false)   |
| `limit`       | int    | Results per page (default: 20, max: 100) |
| `offset`      | int    | Pagination offset                        |

### Example: Create a Dataset

```bash
curl -X POST http://localhost:3000/api/datasets \
  -H "Content-Type: application/json" \
  -H "X-DataHub-API-Key: dh_your_api_key_here" \
  -d '{
    "name": "confluence-engineering-docs",
    "source_type": "confluence",
    "storage_backend": "s3",
    "storage_path": "s3://datasets/confluence/engineering-2024",
    "host": "collector-01.local",
    "owner": "data-team",
    "tags": ["documentation", "engineering"],
    "description": "Engineering documentation from Confluence"
  }'
```

### Example: Search

```bash
# Full-text search
curl -H "X-DataHub-API-Key: dh_your_api_key_here" \
  "http://localhost:3000/api/datasets/search?q=engineering+docs"

# Fuzzy search (typo-tolerant)
curl -H "X-DataHub-API-Key: dh_your_api_key_here" \
  "http://localhost:3000/api/datasets/search?q=enginering&fuzzy=true"
```

## Testing

The project has comprehensive test coverage with Jest and React Testing Library.

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run in watch mode
npm run test:watch
```

### Test Coverage

- ✅ **81 passing tests** across 11 test suites
- ✅ **94-100% coverage** on API routes
- ✅ **87-100% coverage** on UI components
- ✅ Full coverage on utility functions including authentication

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## CI/CD

### Continuous Integration

GitHub Actions automatically runs on every push and pull request:

- ✅ Test suite on Node.js 18.x and 20.x
- ✅ ESLint and code formatting checks
- ✅ TypeScript type checking
- ✅ Production build verification
- ✅ Docker image build (main branch)

### Local Pre-Push Checks

Run these commands to match CI checks before pushing:

```bash
npm test -- --coverage    # Tests
npm run lint              # Linting
npm run format -- --check # Formatting
npm run type-check        # Types
npm run build             # Build
```

## Configuration

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |

## License

MIT
