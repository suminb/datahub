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
      return "Duplicate entry: a record with this value already exists";
    }

    if (dbError.code === "23503") {
      // Foreign key violation
      return "Invalid reference: the referenced record does not exist";
    }

    if (dbError.code === "23514") {
      // Check constraint violation
      return "Invalid data: the value does not meet validation requirements";
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
