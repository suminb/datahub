import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API and database connection
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "healthy" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
