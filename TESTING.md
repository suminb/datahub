# Datahub Testing Documentation

## Overview

This project uses **Jest** and **React Testing Library** for comprehensive testing of components, API routes, and utility functions.

### ✅ Tests Implemented: 44 passing tests across 7 test suites

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-reruns on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Coverage by Component

### API Routes (Excellent Coverage)

#### `/api/datasets` - **94.87% coverage**

- ✅ GET: List datasets with pagination
- ✅ GET: Filter by source_type, status, owner
- ✅ GET: Respect limit and offset parameters
- ✅ POST: Create new datasets
- ✅ POST: Handle default values
- ✅ Error handling for both endpoints

#### `/api/datasets/[id]` - **97.77% coverage**

- ✅ GET: Fetch single dataset by ID
- ✅ GET: Handle 404 for missing datasets
- ✅ PATCH: Update dataset fields (name, version, tags, etc.)
- ✅ PATCH: Handle empty update payloads
- ✅ DELETE: Remove datasets
- ✅ Error handling for all operations

#### `/api/datasets/stats` - **100% coverage**

- ✅ Aggregate statistics (total datasets, items, bytes)
- ✅ Group by source type
- ✅ Group by status
- ✅ Handle zero datasets
- ✅ Handle null values from database

### Components (Excellent Coverage)

#### `StatsCard` - **100% coverage**

- ✅ Render label and value
- ✅ Handle string and number values
- ✅ Apply all variants (default, accent, success, warning, info)

#### `DatasetTable` - **100% coverage**

- ✅ Display empty state
- ✅ Render dataset rows
- ✅ Display tags with overflow handling (+N for extra tags)
- ✅ Handle null values (show dash for empty fields)
- ✅ Format numbers and bytes correctly
- ✅ Link to dataset detail pages

#### `SearchBox` - **100% coverage**

- ✅ Render with default and custom placeholders
- ✅ Update input value on change
- ✅ Debounce search (300ms delay)
- ✅ Update URL parameters
- ✅ Clear query parameters when empty
- ✅ Initialize from URL parameters

### Utility Functions - **100% coverage**

#### Formatting Functions (`lib/api.ts`)

- ✅ `formatBytes()` - B, KB, MB, GB formatting
- ✅ `formatNumber()` - Locale-aware number formatting
- ✅ `formatDate()` - Date formatting
- ✅ `formatDateTime()` - Date and time formatting

## Test Files Structure

```
src/
├── lib/
│   ├── api.ts
│   └── __tests__/
│       └── api.test.ts (4 tests)
├── components/
│   ├── DatasetTable.tsx
│   ├── StatsCard.tsx
│   ├── SearchBox.tsx
│   └── __tests__/
│       ├── DatasetTable.test.tsx (7 tests)
│       ├── StatsCard.test.tsx (5 tests)
│       └── SearchBox.test.tsx (6 tests)
└── app/
    └── api/
        └── datasets/
            ├── route.ts
            ├── [id]/route.ts
            ├── stats/route.ts
            └── __tests__/
                ├── route.test.ts (8 tests)
                ├── [id]/__tests__/route.test.ts (9 tests)
                └── stats/__tests__/route.test.ts (5 tests)
```

## What's Tested vs. What's Not

### ✅ Well Tested (85%+ coverage)

- API endpoints for CRUD operations
- Statistics aggregation
- UI components (StatsCard, DatasetTable, SearchBox)
- Utility functions for formatting

### 🔶 Partially Tested

- Main page component (`page.tsx`) - 0% coverage
- Dataset detail page (`datasets/[id]/page.tsx`) - 0% coverage
  - These require complex React component testing with state management
  - Can be added in future iterations

### ⏭️ Not Yet Tested

- `Header` component - Simple component, low priority
- `/api/datasets/search` endpoint - Can be added later
- `/api/health` endpoint - Simple endpoint, low priority
- `lib/db.ts` - Database connection (mocked in tests)

## Writing New Tests

### Component Test Example

```typescript
import { render, screen } from "@testing-library/react";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### API Route Test Example

```typescript
/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "../route";
import pool from "@/lib/db";

// Mock the database
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe("GET /api/my-route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns data", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: "1" }] } as any);

    const request = new NextRequest("http://localhost/api/my-route");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "1" });
  });
});
```

## Test Configuration

### Configuration Files

- **jest.config.js** - Main Jest configuration for Next.js
- **jest.setup.js** - Test setup, mocks, and environment configuration

### Environment Setup

- Uses `jsdom` environment for React component tests (default)
- Uses `node` environment for API route tests (specify with `@jest-environment node` comment)
- Next.js router and navigation hooks are automatically mocked

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- View HTML report: `coverage/lcov-report/index.html`
- LCOV file: `coverage/lcov.info` (for CI/CD integration)

## Key Testing Patterns Used

1. **Database Mocking**: Uses Jest mocks to simulate PostgreSQL responses
2. **Next.js Router Mocking**: Mocks Next.js navigation hooks for client components
3. **React Testing Library**: Tests components in isolation with user-centric queries
4. **Async Testing**: Proper handling of async API calls and promises
5. **Error Cases**: Tests both success and failure scenarios
6. **Parallel Test Execution**: Tests run in parallel for fast feedback

## CI/CD Integration

### GitHub Actions Workflow

The project includes a comprehensive GitHub Actions workflow at `.github/workflows/datahub-ci.yml` that automatically runs on:

- **Push** to any branch (when datahub files change)
- **Pull Requests** to main/master/develop branches

### CI Pipeline Jobs

The CI pipeline includes the following jobs:

1. **Test Suite** (`test`)
   - Tests on Node.js 18.x and 20.x
   - Runs all 44 tests with coverage
   - Uploads coverage reports to Codecov (optional)
   - Uploads coverage artifacts for review

2. **Linting** (`lint`)
   - Runs ESLint to check code quality
   - Verifies code formatting with Prettier

3. **Type Checking** (`type-check`)
   - Runs TypeScript compiler type checks
   - Ensures type safety across the codebase

4. **Build** (`build`)
   - Builds Next.js application for production
   - Uploads build artifacts
   - Verifies the app can compile successfully

5. **Docker Build** (`docker`)
   - Builds Docker image (only on main/master branch)
   - Uses BuildKit caching for efficiency
   - Tags with commit SHA

### Workflow Configuration

```yaml
# Trigger on changes to datahub files
on:
  push:
    paths:
      - "datahub/**"
  pull_request:
    branches: [main, master, develop]
    paths:
      - "datahub/**"
```

### Local Testing Before Push

Run these commands locally to match CI checks:

```bash
# Run all tests with coverage
npm test -- --coverage

# Check linting
npm run lint

# Verify code formatting
npm run format -- --check

# Type check
npm run type-check

# Build the application
npm run build
```

### Viewing CI Results

- Check the **Actions** tab in GitHub to see workflow runs
- View coverage reports in the **Artifacts** section
- If Codecov is configured, view detailed coverage at codecov.io

## Future Test Additions

1. **Integration Tests**: Test full user flows end-to-end
2. **E2E Tests**: Browser-based testing with Playwright/Cypress
3. **Performance Tests**: Test large dataset handling
4. **Search Endpoint**: Add tests for `/api/datasets/search`
5. **Page Components**: Add React component tests for main pages

## Dependencies

- **jest** - Test runner
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers
- **jest-environment-jsdom** - DOM environment for React tests

## Notes

- Console errors in test output are expected (testing error cases)
- Mock data is intentionally simple for maintainability
- Tests run in under 2 seconds for fast feedback
- Coverage report generated in `coverage/` directory
