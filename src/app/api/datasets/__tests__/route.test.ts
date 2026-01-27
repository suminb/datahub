/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import pool from "@/lib/db";

// Mock the database pool
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe("/api/datasets GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated datasets", async () => {
    const mockDatasets = [
      { id: "1", name: "Dataset 1", created_at: "2024-01-01" },
      { id: "2", name: "Dataset 2", created_at: "2024-01-02" },
    ];

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ count: "2" }] } as any)
      .mockResolvedValueOnce({ rows: mockDatasets } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      items: mockDatasets,
      total: 2,
      limit: 20,
      offset: 0,
    });
  });

  it("filters by source_type", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ count: "1" }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets?source_type=notion");
    await GET(request);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE source_type = $1"),
      expect.arrayContaining(["notion"])
    );
  });

  it("filters by status", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ count: "1" }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets?status=active");
    await GET(request);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE status = $1"),
      expect.arrayContaining(["active"])
    );
  });

  it("respects limit and offset parameters", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ count: "100" }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets?limit=10&offset=20");
    const response = await GET(request);
    const data = await response.json();

    expect(data.limit).toBe(10);
    expect(data.offset).toBe(20);
  });

  it("handles database errors", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch datasets");
  });
});

describe("/api/datasets POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new dataset", async () => {
    const newDataset = {
      name: "New Dataset",
      source_type: "notion",
      storage_backend: "s3",
      storage_path: "/data/new",
    };

    const mockCreatedDataset = { id: "new-id", ...newDataset };
    mockPool.query.mockResolvedValueOnce({ rows: [mockCreatedDataset] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      body: JSON.stringify(newDataset),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe("New Dataset");
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO datasets"),
      expect.any(Array)
    );
  });

  it("uses default values for optional fields", async () => {
    const minimalDataset = {
      name: "Minimal",
      source_type: "notion",
      storage_backend: "s3",
      storage_path: "/data",
    };

    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: "id", ...minimalDataset, version: "1.0.0", status: "active" }],
    } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      body: JSON.stringify(minimalDataset),
    });

    await POST(request);

    const insertCall = mockPool.query.mock.calls[0];
    const insertValues = insertCall[1];

    expect(insertValues).toContain("1.0.0"); // default version
    expect(insertValues).toContain("active"); // default status
    expect(insertValues).toContain("unknown"); // default collected_by
  });

  it("handles database errors during creation", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Insert failed"));

    const request = new NextRequest("http://localhost:3000/api/datasets", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to create dataset");
  });
});
