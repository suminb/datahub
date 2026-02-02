import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source_type = searchParams.get("source_type");
  const status = searchParams.get("status");
  const owner = searchParams.get("owner");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (source_type) {
      conditions.push(`source_type = $${paramIndex++}`);
      params.push(source_type);
    }
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (owner) {
      conditions.push(`owner = $${paramIndex++}`);
      params.push(owner);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(`SELECT COUNT(*) FROM datasets ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM datasets ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      items: result.rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch datasets:", error);
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || randomUUID();
    const now = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO datasets (
        id, name, version, description, source_type, source_config,
        collected_at, collected_by, collection_params, item_count, total_size_bytes,
        storage_backend, storage_path, host, owner, tags, status,
        created_at, updated_at, checksum, schema_version
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *`,
      [
        id,
        body.name,
        body.version || "1.0.0",
        body.description || null,
        body.source_type,
        JSON.stringify(body.source_config || {}),
        now,
        body.collected_by || "unknown",
        JSON.stringify(body.collection_params || {}),
        body.item_count || 0,
        body.total_size_bytes || 0,
        body.storage_backend,
        body.storage_path,
        body.host || null,
        body.owner || null,
        body.tags || [],
        body.status || "active",
        now,
        now,
        body.checksum || null,
        "1.0",
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create dataset:", error);
    return NextResponse.json({ error: "Failed to create dataset" }, { status: 500 });
  }
}
