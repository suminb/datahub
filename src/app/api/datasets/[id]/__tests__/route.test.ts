/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "../route";
import pool from "@/lib/db";
import * as middleware from "@/lib/middleware";

// Mock the database pool
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

// Mock the middleware
jest.mock("@/lib/middleware");

const mockPool = pool as jest.Mocked<typeof pool>;
const mockRequireApiKey = middleware.requireApiKey as jest.MockedFunction<
  typeof middleware.requireApiKey
>;

describe("/api/datasets/[id] GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default, mock successful authentication
    mockRequireApiKey.mockResolvedValue(null);
  });

  it("returns dataset by id", async () => {
    const mockDataset = { id: "123", name: "Test Dataset" };
    mockPool.query.mockResolvedValueOnce({ rows: [mockDataset] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/123");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockDataset);
    expect(mockPool.query).toHaveBeenCalledWith("SELECT * FROM datasets WHERE id = $1", ["123"]);
  });

  it("returns 404 when dataset not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/999");
    const response = await GET(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Dataset not found");
  });

  it("handles database errors", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Query failed"));

    const request = new NextRequest("http://localhost:3000/api/datasets/123");
    const response = await GET(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(500);
  });
});

describe("/api/datasets/[id] PATCH", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default, mock successful authentication
    mockRequireApiKey.mockResolvedValue(null);
  });

  it("updates dataset fields", async () => {
    const updates = { name: "Updated Name", version: "2.0.0" };
    const updatedDataset = { id: "123", ...updates };
    mockPool.query.mockResolvedValueOnce({ rows: [updatedDataset] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/123", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Updated Name");
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE datasets SET"),
      expect.arrayContaining(["Updated Name", "2.0.0", "123"])
    );
  });

  it("updates tags as array", async () => {
    const updates = { tags: ["tag1", "tag2"] };
    const updatedDataset = { id: "123", tags: ["tag1", "tag2"] };
    mockPool.query.mockResolvedValueOnce({ rows: [updatedDataset] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/123", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    await PATCH(request, { params: Promise.resolve({ id: "123" }) });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([["tag1", "tag2"]])
    );
  });

  it("returns 400 when no fields to update", async () => {
    const request = new NextRequest("http://localhost:3000/api/datasets/123", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No fields to update");
  });

  it("returns 404 when dataset not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/999", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("handles database errors", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Update failed"));

    const request = new NextRequest("http://localhost:3000/api/datasets/123", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(500);
  });
});

describe("/api/datasets/[id] DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // By default, mock successful authentication
    mockRequireApiKey.mockResolvedValue(null);
  });

  it("deletes dataset", async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/123", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(204);
    expect(mockPool.query).toHaveBeenCalledWith("DELETE FROM datasets WHERE id = $1", ["123"]);
  });

  it("returns 404 when dataset not found", async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0 } as any);

    const request = new NextRequest("http://localhost:3000/api/datasets/999", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "999" }),
    });

    expect(response.status).toBe(404);
  });

  it("handles database errors", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("Delete failed"));

    const request = new NextRequest("http://localhost:3000/api/datasets/123", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123" }),
    });

    expect(response.status).toBe(500);
  });
});
