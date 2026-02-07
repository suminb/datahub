import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { randomUUID } from "crypto";
import { getDatabaseErrorMessage } from "@/lib/errors";

/**
 * @openapi
 * /datasets:
 *   get:
 *     summary: List all datasets
 *     description: Retrieve a paginated list of datasets with optional filtering
 *     tags:
 *       - Datasets
 *     parameters:
 *       - name: source_type
 *         in: query
 *         description: Filter by source type (e.g., confluence, jira, notion)
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         description: Filter by status
 *         schema:
 *           type: string
 *           enum: [active, archived, deleted]
 *       - name: owner
 *         in: query
 *         description: Filter by owner
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 'Results per page (default: 20, max: 100)'
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: offset
 *         in: query
 *         description: Pagination offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: List of datasets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dataset'
 *                 total:
 *                   type: integer
 *                   description: Total number of datasets matching the query
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Failed to fetch datasets: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * @openapi
 * /datasets:
 *   post:
 *     summary: Create a new dataset
 *     description: Register a new dataset in the DataHub
 *     tags:
 *       - Datasets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, source_type, storage_backend, storage_path]
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional UUID (will be auto-generated if not provided)
 *               name:
 *                 type: string
 *                 description: Dataset name
 *                 example: confluence-engineering-docs
 *               version:
 *                 type: string
 *                 description: Dataset version
 *                 example: 1.0.0
 *               description:
 *                 type: string
 *                 description: Dataset description
 *                 example: Engineering documentation from Confluence
 *               source_type:
 *                 type: string
 *                 description: Type of source system
 *                 example: confluence
 *               source_config:
 *                 type: object
 *                 description: Configuration for the source system
 *               collected_by:
 *                 type: string
 *                 description: Who or what collected the dataset
 *                 example: collector-01
 *               collection_params:
 *                 type: object
 *                 description: Parameters used during collection
 *               item_count:
 *                 type: integer
 *                 description: Number of items in the dataset
 *                 example: 1234
 *               total_size_bytes:
 *                 type: integer
 *                 description: Total size of the dataset in bytes
 *                 example: 1048576
 *               storage_backend:
 *                 type: string
 *                 description: Storage backend type
 *                 example: s3
 *               storage_path:
 *                 type: string
 *                 description: Path to the dataset in storage
 *                 example: s3://datasets/confluence/engineering-2024
 *               host:
 *                 type: string
 *                 description: Host where the dataset is stored
 *                 example: collector-01.local
 *               owner:
 *                 type: string
 *                 description: Dataset owner
 *                 example: data-team
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags associated with the dataset
 *                 example: [documentation, engineering]
 *               status:
 *                 type: string
 *                 description: Dataset status
 *                 enum: [active, archived, deleted]
 *                 example: active
 *               checksum:
 *                 type: string
 *                 description: Dataset checksum
 *     responses:
 *       201:
 *         description: Dataset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dataset'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Failed to create dataset: ${errorMessage}` }, { status: 500 });
  }
}
