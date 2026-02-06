import { getDatabaseErrorMessage } from "../errors";

describe("getDatabaseErrorMessage", () => {
  it("should handle NOT NULL constraint violations", () => {
    const error = {
      code: "23502",
      column: "storage_backend",
      table: "datasets",
      message: 'null value in column "storage_backend" violates not-null constraint',
    };

    const result = getDatabaseErrorMessage(error);
    expect(result).toBe("Missing required field: storage_backend in datasets");
  });

  it("should handle unique constraint violations", () => {
    const error = {
      code: "23505",
      constraint: "datasets_name_unique",
      message: "duplicate key value violates unique constraint",
    };

    const result = getDatabaseErrorMessage(error);
    expect(result).toBe("Duplicate entry violates datasets_name_unique");
  });

  it("should handle foreign key violations", () => {
    const error = {
      code: "23503",
      constraint: "fk_datasets_owner",
      message: "insert or update violates foreign key constraint",
    };

    const result = getDatabaseErrorMessage(error);
    expect(result).toBe("Invalid reference violates fk_datasets_owner");
  });

  it("should handle check constraint violations", () => {
    const error = {
      code: "23514",
      constraint: "check_positive_size",
      message: "new row violates check constraint",
    };

    const result = getDatabaseErrorMessage(error);
    expect(result).toBe("Data violates check_positive_size");
  });

  it("should handle database errors with message but no code", () => {
    const error = {
      message: "connection timeout",
    };

    const result = getDatabaseErrorMessage(error);
    expect(result).toBe("connection timeout");
  });

  it("should handle Error instances", () => {
    const error = new Error("Network error");

    const result = getDatabaseErrorMessage(error);
    expect(result).toBe("Network error");
  });

  it("should handle unknown errors", () => {
    const result = getDatabaseErrorMessage("string error");
    expect(result).toBe("An unknown error occurred");
  });

  it("should handle null/undefined errors", () => {
    expect(getDatabaseErrorMessage(null)).toBe("An unknown error occurred");
    expect(getDatabaseErrorMessage(undefined)).toBe("An unknown error occurred");
  });
});
