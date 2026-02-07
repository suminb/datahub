import { createHash, randomBytes } from "crypto";
import pool from "@/lib/db";

export interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  status: string;
  created_at: Date;
  last_used_at: Date | null;
  revoked_at: Date | null;
}

/**
 * Generate a secure API key
 * Format: dh_<32 bytes of random data in hex>
 */
export function generateApiKey(): string {
  const randomData = randomBytes(32);
  return `dh_${randomData.toString("hex")}`;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key against the database
 * Returns the API key record if valid, null otherwise
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  if (!key) {
    return null;
  }

  const keyHash = hashApiKey(key);

  try {
    const result = await pool.query(
      `SELECT id, key_hash, name, status, created_at, last_used_at, revoked_at 
       FROM api_keys 
       WHERE key_hash = $1 AND status = 'active'`,
      [keyHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const apiKey = result.rows[0] as ApiKey;

    // Update last_used_at timestamp asynchronously (fire-and-forget)
    // Note: In high-concurrency scenarios, this may not reflect the exact last use
    // due to potential race conditions. This is acceptable as it's for audit purposes only.
    pool
      .query(`UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`, [apiKey.id])
      .catch((error) => {
        console.error("Failed to update last_used_at:", error);
      });

    return apiKey;
  } catch (error) {
    console.error("Error validating API key:", error);
    return null;
  }
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(headers: Headers): string | null {
  return headers.get("x-datahub-api-key");
}
