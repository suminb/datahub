/* eslint-disable no-console */
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrations = [
  // Enable extensions
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,

  // Create datasets table
  `CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT '1.0.0',
    description TEXT,
    source_type VARCHAR(50) NOT NULL,
    source_config JSONB DEFAULT '{}',
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    collected_by VARCHAR(255) DEFAULT 'unknown',
    collection_params JSONB DEFAULT '{}',
    item_count INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    storage_backend VARCHAR(50) NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    host VARCHAR(255),
    owner VARCHAR(255),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64),
    schema_version VARCHAR(20) DEFAULT '1.0',
    search_vector TSVECTOR
  )`,

  // Create function to update search vector
  `CREATE OR REPLACE FUNCTION datasets_search_vector_update() RETURNS trigger AS $$
  BEGIN
    NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.owner, '')), 'D');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,

  // Create trigger for search vector
  `DROP TRIGGER IF EXISTS datasets_search_vector_trigger ON datasets`,
  `CREATE TRIGGER datasets_search_vector_trigger
    BEFORE INSERT OR UPDATE ON datasets
    FOR EACH ROW EXECUTE PROCEDURE datasets_search_vector_update()`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS ix_datasets_search_vector ON datasets USING GIN(search_vector)`,
  `CREATE INDEX IF NOT EXISTS ix_datasets_name_trgm ON datasets USING GIN(name gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS ix_datasets_source_type ON datasets(source_type)`,
  `CREATE INDEX IF NOT EXISTS ix_datasets_status ON datasets(status)`,
  `CREATE INDEX IF NOT EXISTS ix_datasets_owner ON datasets(owner)`,
  `CREATE INDEX IF NOT EXISTS ix_datasets_created_at ON datasets(created_at)`,
  `CREATE INDEX IF NOT EXISTS ix_datasets_tags ON datasets USING GIN(tags)`,

  // Create enum type for API key status
  `DO $$ BEGIN
    CREATE TYPE api_key_status AS ENUM ('active', 'revoked');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$`,

  // Create api_keys table
  // Note: key_hash stores the SHA-256 hash of the actual API key for security.
  // The plaintext key is never stored - only shown once when issued.
  // This is similar to password hashing: if the DB is compromised, keys remain secure.
  `CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(36) PRIMARY KEY,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status api_key_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
  )`,

  // Create indexes for api_keys
  `CREATE INDEX IF NOT EXISTS ix_api_keys_key_hash ON api_keys(key_hash)`,
  `CREATE INDEX IF NOT EXISTS ix_api_keys_status ON api_keys(status)`,
];

async function migrate() {
  console.log("Running migrations...");
  try {
    for (const sql of migrations) {
      console.log(`  Running: ${sql.substring(0, 50)}...`);
      await pool.query(sql);
    }
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
