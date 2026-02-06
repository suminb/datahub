/**
 * Extracts useful error information from database errors to send to clients.
 * Returns a user-friendly error message with relevant details for debugging.
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const dbError = error as Record<string, unknown>;

    // PostgreSQL constraint violation errors
    if (dbError.code === "23502") {
      // NOT NULL constraint violation
      const column = dbError.column || "unknown column";
      const table = dbError.table || "unknown table";
      return `Missing required field: ${column} in ${table}`;
    }

    if (dbError.code === "23505") {
      // Unique constraint violation
      const constraint = dbError.constraint || "unique constraint";
      return `Duplicate entry violates ${constraint}`;
    }

    if (dbError.code === "23503") {
      // Foreign key violation
      const constraint = dbError.constraint || "foreign key constraint";
      return `Invalid reference violates ${constraint}`;
    }

    if (dbError.code === "23514") {
      // Check constraint violation
      const constraint = dbError.constraint || "check constraint";
      return `Data violates ${constraint}`;
    }

    // Return the database error message if available
    if (typeof dbError.message === "string") {
      return dbError.message;
    }
  }

  // Fallback for non-database errors
  if (error instanceof Error) {
    return error.message;
  }

  return "An unknown error occurred";
}
