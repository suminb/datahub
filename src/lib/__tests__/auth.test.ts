/**
 * @jest-environment node
 */

import { generateApiKey, hashApiKey, validateApiKey, extractApiKey } from "../auth";
import pool from "@/lib/db";

// Mock the database pool
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe("auth utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateApiKey", () => {
    it("generates a key with correct format", () => {
      const key = generateApiKey();
      expect(key).toMatch(/^dh_[a-f0-9]{64}$/);
    });

    it("generates unique keys", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("hashApiKey", () => {
    it("returns a SHA-256 hash", () => {
      const key = "dh_test123";
      const hash = hashApiKey(key);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash.length).toBe(64);
    });

    it("generates the same hash for the same input", () => {
      const key = "dh_test123";
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      expect(hash1).toBe(hash2);
    });

    it("generates different hashes for different inputs", () => {
      const hash1 = hashApiKey("dh_test123");
      const hash2 = hashApiKey("dh_test456");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("validateApiKey", () => {
    it("returns null for empty key", async () => {
      const result = await validateApiKey("");
      expect(result).toBeNull();
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("returns null for non-existent key", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await validateApiKey("dh_nonexistent");
      expect(result).toBeNull();
    });

    it("returns the API key record for valid key", async () => {
      const mockApiKey = {
        id: "test-id",
        key_hash: "hash",
        name: "Test Key",
        status: "active",
        created_at: new Date(),
        last_used_at: null,
        revoked_at: null,
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockApiKey] } as any)
        .mockResolvedValueOnce({ rows: [] } as any); // for update query

      const result = await validateApiKey("dh_validkey");
      expect(result).toEqual(mockApiKey);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        expect.any(Array)
      );
    });

    it("returns null for revoked key", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      const result = await validateApiKey("dh_revoked");
      expect(result).toBeNull();
    });

    it("handles database errors gracefully", async () => {
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      const result = await validateApiKey("dh_test");
      expect(result).toBeNull();
    });
  });

  describe("extractApiKey", () => {
    it("extracts API key from x-datahub-api-key header", () => {
      const headers = new Headers();
      headers.set("x-datahub-api-key", "dh_test123");

      const key = extractApiKey(headers);
      expect(key).toBe("dh_test123");
    });

    it("returns null when header is not present", () => {
      const headers = new Headers();
      const key = extractApiKey(headers);
      expect(key).toBeNull();
    });

    it("is case-insensitive for header name", () => {
      const headers = new Headers();
      headers.set("X-DataHub-API-Key", "dh_test123");

      const key = extractApiKey(headers);
      expect(key).toBe("dh_test123");
    });
  });
});
