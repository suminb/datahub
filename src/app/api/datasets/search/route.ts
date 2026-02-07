import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getDatabaseErrorMessage } from "@/lib/errors";
import { requireApiKey } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const authError = await requireApiKey(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const source_type = searchParams.get("source_type");
  const status = searchParams.get("status");
  const owner = searchParams.get("owner");
  const tags = searchParams.get("tags");
  const fuzzy = searchParams.get("fuzzy") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const conditions: string[] = [];
    const params: (string | number | string[])[] = [];
    let paramIndex = 1;

    // Full-text search condition
    if (fuzzy) {
      // Trigram similarity for fuzzy matching
      conditions.push(
        `(name % $${paramIndex} OR search_vector @@ plainto_tsquery('english', $${paramIndex}))`
      );
    } else {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`);
    }
    params.push(q);
    paramIndex++;

    // Additional filters
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
    if (tags) {
      const tagList = tags.split(",");
      conditions.push(`tags && $${paramIndex++}`);
      params.push(tagList);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Count query
    const countResult = await pool.query(`SELECT COUNT(*) FROM datasets ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Search query with ranking
    const scoreExpr = fuzzy
      ? `GREATEST(similarity(name, $1), ts_rank(search_vector, plainto_tsquery('english', $1)))`
      : `ts_rank(search_vector, plainto_tsquery('english', $1))`;

    const result = await pool.query(
      `SELECT *, ${scoreExpr} as relevance_score 
       FROM datasets ${whereClause} 
       ORDER BY relevance_score DESC 
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      items: result.rows,
      total,
      query: q,
    });
  } catch (error) {
    console.error("Search failed:", error);
    const errorMessage = getDatabaseErrorMessage(error);
    return NextResponse.json({ error: `Search failed: ${errorMessage}` }, { status: 500 });
  }
}
