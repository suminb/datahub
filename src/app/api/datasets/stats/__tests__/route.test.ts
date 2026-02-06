/**
 * @jest-environment node
 */

import { GET } from "../route";
import pool from "@/lib/db";

// Mock the database pool
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe("/api/datasets/stats GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns aggregated statistics", async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ total_datasets: "10", total_items: "1000", total_bytes: "5000000" }],
      } as any)
      .mockResolvedValueOnce({
        rows: [
          { source_type: "notion", count: "6" },
          { source_type: "github", count: "4" },
        ],
      } as any)
      .mockResolvedValueOnce({
        rows: [
          { status: "active", count: "8" },
          { status: "archived", count: "2" },
        ],
      } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      total_datasets: 10,
      total_items: 1000,
      total_bytes: 5000000,
      by_source_type: {
        notion: 6,
        github: 4,
      },
      by_status: {
        active: 8,
        archived: 2,
      },
    });
  });

  it("handles zero datasets", async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ total_datasets: "0", total_items: "0", total_bytes: "0" }],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const response = await GET();
    const data = await response.json();

    expect(data.total_datasets).toBe(0);
    expect(data.total_items).toBe(0);
    expect(data.total_bytes).toBe(0);
    expect(data.by_source_type).toEqual({});
    expect(data.by_status).toEqual({});
  });

  it("handles null values from database query", async () => {
    // When COALESCE returns 0 in the query, it comes back as '0' string from postgres
    mockPool.query
      .mockResolvedValueOnce({
        rows: [{ total_datasets: "5", total_items: "0", total_bytes: "0" }],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const response = await GET();
    const data = await response.json();

    expect(data.total_datasets).toBe(5);
    expect(data.total_items).toBe(0);
    expect(data.total_bytes).toBe(0);
  });

  it("handles database errors", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Query failed"));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch stats: Query failed");
  });
});
