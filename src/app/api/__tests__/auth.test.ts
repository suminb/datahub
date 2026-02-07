/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, POST } from "../datasets/route";
import { GET as GET_BY_ID, PATCH, DELETE } from "../datasets/[id]/route";
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

describe("API Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Missing API key", () => {
    beforeEach(() => {
      mockRequireApiKey.mockResolvedValue(
        new Response(
          JSON.stringify({
            error: "Missing API key. Please provide a valid API key in the X-DataHub-API-Key header.",
          }),
          { status: 401 }
        ) as any
      );
    });

    it("returns 401 for GET /api/datasets without API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/datasets");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Missing API key");
    });

    it("returns 401 for POST /api/datasets without API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/datasets", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Missing API key");
    });

    it("returns 401 for GET /api/datasets/[id] without API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/datasets/123");
      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: "123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Missing API key");
    });

    it("returns 401 for PATCH /api/datasets/[id] without API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/datasets/123", {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Missing API key");
    });

    it("returns 401 for DELETE /api/datasets/[id] without API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/datasets/123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Missing API key");
    });
  });

  describe("Invalid API key", () => {
    beforeEach(() => {
      mockRequireApiKey.mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid or inactive API key." }), { status: 401 }) as any
      );
    });

    it("returns 401 for GET /api/datasets with invalid API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/datasets", {
        headers: {
          "x-datahub-api-key": "dh_invalid",
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Invalid or inactive API key");
    });
  });

  describe("Valid API key", () => {
    beforeEach(() => {
      mockRequireApiKey.mockResolvedValue(null);
    });

    it("allows GET /api/datasets with valid API key", async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ count: "0" }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const request = new NextRequest("http://localhost:3000/api/datasets", {
        headers: {
          "x-datahub-api-key": "dh_valid",
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it("allows POST /api/datasets with valid API key", async () => {
      const newDataset = {
        name: "Test Dataset",
        source_type: "notion",
        storage_backend: "s3",
        storage_path: "/data/test",
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: "new-id", ...newDataset }],
      } as any);

      const request = new NextRequest("http://localhost:3000/api/datasets", {
        method: "POST",
        headers: {
          "x-datahub-api-key": "dh_valid",
        },
        body: JSON.stringify(newDataset),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it("allows GET /api/datasets/[id] with valid API key", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: "123", name: "Test" }],
      } as any);

      const request = new NextRequest("http://localhost:3000/api/datasets/123", {
        headers: {
          "x-datahub-api-key": "dh_valid",
        },
      });

      const response = await GET_BY_ID(request, { params: Promise.resolve({ id: "123" }) });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it("allows PATCH /api/datasets/[id] with valid API key", async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: "123", name: "Updated" }],
      } as any);

      const request = new NextRequest("http://localhost:3000/api/datasets/123", {
        method: "PATCH",
        headers: {
          "x-datahub-api-key": "dh_valid",
        },
        body: JSON.stringify({ name: "Updated" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: "123" }) });

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalled();
    });

    it("allows DELETE /api/datasets/[id] with valid API key", async () => {
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1,
      } as any);

      const request = new NextRequest("http://localhost:3000/api/datasets/123", {
        method: "DELETE",
        headers: {
          "x-datahub-api-key": "dh_valid",
        },
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: "123" }) });

      expect(response.status).toBe(204);
      expect(mockPool.query).toHaveBeenCalled();
    });
  });
});
