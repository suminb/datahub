/* eslint-disable no-console */
/**
 * API Key Management CLI
 * 
 * We use the pg library directly (no ORM) to keep things simple and consistent
 * with the rest of the codebase. This avoids introducing additional dependencies
 * and complexity for basic CRUD operations.
 */
import pg from "pg";
import { createHash, randomBytes } from "crypto";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function generateApiKey() {
  // Generate 32 bytes (256 bits) of random data for cryptographic strength.
  // This provides 2^256 possible keys, making brute force attacks infeasible.
  // The resulting key is 64 hex characters plus the 'dh_' prefix (67 chars total).
  const randomData = randomBytes(32);
  return `dh_${randomData.toString("hex")}`;
}

function hashApiKey(key) {
  return createHash("sha256").update(key).digest("hex");
}

function generateId() {
  return randomBytes(16).toString("hex");
}

async function issueApiKey(name) {
  if (!name) {
    console.error("Error: API key name is required");
    console.log("Usage: npm run apikey:issue <name>");
    process.exit(1);
  }

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const id = generateId();

  try {
    await pool.query(
      `INSERT INTO api_keys (id, key_hash, name, status, created_at) 
       VALUES ($1, $2, $3, 'active', NOW())`,
      [id, keyHash, name]
    );
  } catch (error) {
    console.error("Failed to issue API key:", error.message || error);
    process.exit(1);
  }

  console.log("✅ API key created successfully!");
  console.log("");
  console.log("Name:", name);
  console.log("Key:", apiKey);
  console.log("");
  console.log("⚠️  IMPORTANT: Save this key now! You won't be able to see it again.");
  console.log("Use it in the X-DataHub-API-Key header for API requests.");
}

async function listApiKeys() {
  let result;
  try {
    result = await pool.query(
      `SELECT id, name, status, created_at, last_used_at, revoked_at 
       FROM api_keys 
       ORDER BY created_at DESC`
    );
  } catch (error) {
    console.error("Failed to list API keys:", error.message || error);
    process.exit(1);
  }

  if (result.rows.length === 0) {
    console.log("No API keys found.");
    return;
  }

  console.log(`Found ${result.rows.length} API key(s):\n`);
  console.log("ID".padEnd(35), "Name".padEnd(25), "Status".padEnd(10), "Created");
  console.log("-".repeat(100));

  for (const key of result.rows) {
    const id = key.id.padEnd(35);
    const name = key.name.padEnd(25);
    const status = key.status.padEnd(10);
    const created = new Date(key.created_at).toISOString().split("T")[0];
    console.log(id, name, status, created);
  }
}

async function revokeApiKey(idOrName) {
  if (!idOrName) {
    console.error("Error: API key ID or name is required");
    console.log("Usage: npm run apikey:revoke <id_or_name>");
    process.exit(1);
  }

  let result;
  try {
    result = await pool.query(
      `UPDATE api_keys 
       SET status = 'revoked', revoked_at = NOW() 
       WHERE (id = $1 OR name = $1) AND status = 'active'
       RETURNING id, name`,
      [idOrName]
    );
  } catch (error) {
    console.error("Failed to revoke API key:", error.message || error);
    process.exit(1);
  }

  if (result.rows.length === 0) {
    console.log(`No active API key found with ID or name: ${idOrName}`);
    process.exit(1);
  }

  console.log("✅ API key revoked successfully!");
  console.log("Name:", result.rows[0].name);
  console.log("ID:", result.rows[0].id);
}

async function deleteApiKey(idOrName) {
  if (!idOrName) {
    console.error("Error: API key ID or name is required");
    console.log("Usage: npm run apikey:delete <id_or_name>");
    process.exit(1);
  }

  let result;
  try {
    result = await pool.query(
      `DELETE FROM api_keys 
       WHERE id = $1 OR name = $1
       RETURNING id, name`,
      [idOrName]
    );
  } catch (error) {
    console.error("Failed to delete API key:", error.message || error);
    process.exit(1);
  }

  if (result.rows.length === 0) {
    console.log(`No API key found with ID or name: ${idOrName}`);
    process.exit(1);
  }

  console.log("✅ API key deleted successfully!");
  console.log("Name:", result.rows[0].name);
  console.log("ID:", result.rows[0].id);
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case "issue":
        await issueApiKey(arg);
        break;
      case "list":
        await listApiKeys();
        break;
      case "revoke":
        await revokeApiKey(arg);
        break;
      case "delete":
        await deleteApiKey(arg);
        break;
      default:
        console.log("DataHub API Key Management");
        console.log("");
        console.log("Commands:");
        console.log("  npm run apikey:issue <name>      - Create a new API key");
        console.log("  npm run apikey:list              - List all API keys");
        console.log("  npm run apikey:revoke <id_or_name> - Revoke an API key");
        console.log("  npm run apikey:delete <id_or_name> - Delete an API key");
        process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main();
