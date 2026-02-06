import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDatabaseErrorMessage } from "@/lib/errors";

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
