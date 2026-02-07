/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { requireApiKey } from "../middleware";
import * as auth from "../auth";

jest.mock("../auth");

const mockValidateApiKey = auth.validateApiKey as jest.MockedFunction<typeof auth.validateApiKey>;
const mockExtractApiKey = auth.extractApiKey as jest.MockedFunction<typeof auth.extractApiKey>;

describe("requireApiKey middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 401 when no API key is provided", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await requireApiKey(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    const data = await response?.json();
    expect(data?.error).toContain("Missing API key");
  });

  it("returns 401 when API key is invalid", async () => {
    mockExtractApiKey.mockReturnValue("dh_invalid");
    mockValidateApiKey.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await requireApiKey(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    const data = await response?.json();
    expect(data?.error).toContain("Invalid or inactive API key");
  });

  it("returns null when API key is valid", async () => {
    const mockApiKey = {
      id: "test-id",
      key_hash: "hash",
      name: "Test Key",
      status: "active",
      created_at: new Date(),
      last_used_at: null,
      revoked_at: null,
    };

    mockExtractApiKey.mockReturnValue("dh_valid");
    mockValidateApiKey.mockResolvedValue(mockApiKey);

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await requireApiKey(request);

    expect(response).toBeNull();
  });

  it("extracts API key from request headers", async () => {
    mockExtractApiKey.mockReturnValue("dh_test");
    mockValidateApiKey.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/datasets", {
      headers: {
        "x-datahub-api-key": "dh_test",
      },
    });

    await requireApiKey(request);

    expect(mockExtractApiKey).toHaveBeenCalledWith(request.headers);
  });

  it("bypasses authentication when DISABLE_API_KEY_AUTH is true", async () => {
    process.env.DISABLE_API_KEY_AUTH = "true";

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await requireApiKey(request);

    expect(response).toBeNull();
    expect(mockExtractApiKey).not.toHaveBeenCalled();
    expect(mockValidateApiKey).not.toHaveBeenCalled();
  });

  it("does not bypass authentication when DISABLE_API_KEY_AUTH is false", async () => {
    process.env.DISABLE_API_KEY_AUTH = "false";
    mockExtractApiKey.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await requireApiKey(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    expect(mockExtractApiKey).toHaveBeenCalled();
  });

  it("does not bypass authentication when DISABLE_API_KEY_AUTH is not set", async () => {
    delete process.env.DISABLE_API_KEY_AUTH;
    mockExtractApiKey.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/api/datasets");
    const response = await requireApiKey(request);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(401);
    expect(mockExtractApiKey).toHaveBeenCalled();
  });
});
