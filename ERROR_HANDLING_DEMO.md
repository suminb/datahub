# Error Handling Demonstration

This document demonstrates how the improved error handling in this PR solves the problem described in the latest comment.

## The Problem

### Before This PR

When a database constraint violation occurs, the API returns only a generic error message to the client:

**Client Error Response:**
```json
{
  "error": "Failed to create dataset"
}
```

**Server Logs (only visible server-side):**
```
Failed to create dataset: error: null value in column "storage_backend" of relation "datasets" violates not-null constraint
    at async l (.next/server/chunks/[root-of-the-server]__24891f34._.js:1:2030)
    ...
  code: '23502',
  column: 'storage_backend',
  table: 'datasets',
  ...
```

**Result:** Debugging is nearly impossible for API consumers because they only see "Failed to create dataset" with no indication of what went wrong.

## The Solution

### After This PR

The API now extracts useful information from database errors and includes it in the client response:

**Client Error Response:**
```json
{
  "error": "Failed to create dataset: Missing required field: storage_backend in datasets"
}
```

**Server Logs (still includes full details for debugging):**
```
Failed to create dataset: error: null value in column "storage_backend" of relation "datasets" violates not-null constraint
    ...
  code: '23502',
  column: 'storage_backend',
  table: 'datasets',
  ...
```

**Result:** The client can now understand exactly what went wrong (missing required field: `storage_backend`) and fix the issue without needing access to server logs!

## How It Works

The new `getDatabaseErrorMessage()` function in `src/lib/errors.ts`:

1. **Detects PostgreSQL error codes:**
   - `23502` → NOT NULL constraint violation
   - `23505` → Unique constraint violation
   - `23503` → Foreign key violation
   - `23514` → Check constraint violation

2. **Extracts relevant information:**
   - For NOT NULL violations: extracts column and table names
   - For other violations: provides user-friendly generic messages

3. **Returns actionable error messages:**
   - NOT NULL: `"Missing required field: {column} in {table}"`
   - Unique: `"Duplicate entry: a record with this value already exists"`
   - Foreign key: `"Invalid reference: the referenced record does not exist"`
   - Check: `"Invalid data: the value does not meet validation requirements"`

## Example: Your Specific Error

For the exact error from your comment:

**Database Error Object:**
```javascript
{
  code: '23502',              // NOT NULL constraint
  column: 'storage_backend',   // Missing column
  table: 'datasets',           // Target table
  message: 'null value in column "storage_backend" of relation "datasets" violates not-null constraint'
}
```

**API Response Sent to Client:**
```json
{
  "error": "Failed to create dataset: Missing required field: storage_backend in datasets"
}
```

**Client Can Now:**
- ✅ Understand that `storage_backend` field is required
- ✅ Fix their API request to include this field
- ✅ Debug without needing server access

## Testing

The implementation includes comprehensive tests in `src/app/api/datasets/__tests__/route.test.ts`:

```typescript
it("handles NOT NULL constraint violations with helpful message", async () => {
  const dbError = {
    code: "23502",
    column: "storage_backend",
    table: "datasets",
    message: 'null value in column "storage_backend" violates not-null constraint',
  };
  mockPool.query.mockRejectedValueOnce(dbError);

  const request = new NextRequest("http://localhost:3000/api/datasets", {
    method: "POST",
    body: JSON.stringify({ name: "Test", source_type: "notion" }),
  });

  const response = await POST(request);

  expect(response.status).toBe(500);
  const data = await response.json();
  expect(data.error).toBe(
    "Failed to create dataset: Missing required field: storage_backend in datasets"
  );
});
```

All 53 tests pass ✅

## Security Considerations

- **Field/table names exposed:** These are already part of the public API schema, so exposing them in error messages doesn't introduce new security risks
- **Constraint names hidden:** Internal database constraint names are NOT exposed, only generic user-friendly messages
- **Server logs unchanged:** Full error details still logged server-side for debugging

## Deployment Note

Since this is a TypeScript project, you'll need to rebuild the application for changes to take effect:

```bash
npm run build
```

Or with Docker:

```bash
docker build -t datahub .
```
