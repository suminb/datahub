import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDatabaseErrorMessage } from "@/lib/errors";

/**
 * @openapi
 * /datasets/{id}:
 *   get:
 *     summary: Get a specific dataset
 *     description: Retrieve details of a single dataset by ID
 *     tags:
 *       - Datasets
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Dataset UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dataset details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dataset'
 *       404:
 *         description: Dataset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await pool.query("SELECT * FROM datasets WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch dataset:", error);
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Failed to fetch dataset: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * @openapi
 * /datasets/{id}:
 *   patch:
 *     summary: Update a dataset
 *     description: Update specific fields of a dataset
 *     tags:
 *       - Datasets
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Dataset UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dataset name
 *               version:
 *                 type: string
 *                 description: Dataset version
 *               description:
 *                 type: string
 *                 description: Dataset description
 *               source_config:
 *                 type: object
 *                 description: Configuration for the source system
 *               collection_params:
 *                 type: object
 *                 description: Parameters used during collection
 *               item_count:
 *                 type: integer
 *                 description: Number of items in the dataset
 *               total_size_bytes:
 *                 type: integer
 *                 description: Total size of the dataset in bytes
 *               storage_path:
 *                 type: string
 *                 description: Path to the dataset in storage
 *               host:
 *                 type: string
 *                 description: Host where the dataset is stored
 *               owner:
 *                 type: string
 *                 description: Dataset owner
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags associated with the dataset
 *               status:
 *                 type: string
 *                 description: Dataset status
 *                 enum: [active, archived, deleted]
 *               checksum:
 *                 type: string
 *                 description: Dataset checksum
 *     responses:
 *       200:
 *         description: Dataset updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dataset'
 *       400:
 *         description: Bad request (no fields to update)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dataset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const allowedFields = [
      "name",
      "version",
      "description",
      "source_config",
      "collection_params",
      "item_count",
      "total_size_bytes",
      "storage_path",
      "host",
      "owner",
      "tags",
      "status",
      "checksum",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex++}`);
        if (field === "source_config" || field === "collection_params") {
          values.push(JSON.stringify(body[field]));
        } else {
          values.push(body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());
    values.push(id);

    const result = await pool.query(
      `UPDATE datasets SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update dataset:", error);
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Failed to update dataset: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * @openapi
 * /datasets/{id}:
 *   delete:
 *     summary: Delete a dataset
 *     description: Remove a dataset from the DataHub
 *     tags:
 *       - Datasets
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Dataset UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Dataset deleted successfully
 *       404:
 *         description: Dataset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query("DELETE FROM datasets WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete dataset:", error);
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Failed to delete dataset: ${errorMessage}` }, { status: 500 });
  }
}
