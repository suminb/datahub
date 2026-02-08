import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractApiKey, validateApiKey } from "@/lib/auth";

/**
 * Middleware to validate API key authentication
 * Returns NextResponse if authentication fails, null if authentication succeeds
 */
export async function requireApiKey(request: NextRequest): Promise<NextResponse | null> {
  // Allow bypassing API key authentication for testing purposes only in non-production environments
  if (process.env.DISABLE_API_KEY_AUTH === "true" && process.env.NODE_ENV !== "production") {
    return null;
  }

  const apiKey = extractApiKey(request.headers);

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key. Please provide a valid API key in the X-DataHub-API-Key header." },
      { status: 401 }
    );
  }

  const validKey = await validateApiKey(apiKey);

  if (!validKey) {
    return NextResponse.json({ error: "Invalid or inactive API key." }, { status: 401 });
  }

  // Authentication successful
  return null;
}
