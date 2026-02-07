import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { requireApiKey } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const authError = await requireApiKey(request);
  if (authError) return authError;

  try {
    // Aggregate stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_datasets,
        COALESCE(SUM(item_count), 0) as total_items,
        COALESCE(SUM(total_size_bytes), 0) as total_bytes
      FROM datasets
    `);

    // By source type
    const sourceResult = await pool.query(`
      SELECT source_type, COUNT(*) as count
      FROM datasets
      GROUP BY source_type
    `);
    const by_source_type: Record<string, number> = {};
    for (const row of sourceResult.rows) {
      by_source_type[row.source_type] = parseInt(row.count);
    }

    // By status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM datasets
      GROUP BY status
    `);
    const by_status: Record<string, number> = {};
    for (const row of statusResult.rows) {
      by_status[row.status] = parseInt(row.count);
    }

    return NextResponse.json({
      total_datasets: parseInt(statsResult.rows[0].total_datasets),
      total_items: parseInt(statsResult.rows[0].total_items),
      total_bytes: parseInt(statsResult.rows[0].total_bytes),
      by_source_type,
      by_status,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Failed to fetch stats: ${errorMessage}` }, { status: 500 });
  }
}
