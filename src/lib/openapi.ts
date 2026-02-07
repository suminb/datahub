/**
 * OpenAPI specification for DataHub API
 */
export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "DataHub API",
    version: "0.1.0",
    description:
      "Centralized metadata hub for dataset management across multiple hosts. Track datasets from multiple sources (Confluence, Jira, Notion, GitHub, Slack, etc.) with full-text search and fuzzy matching capabilities.",
    contact: {
      name: "DataHub Support",
      url: "https://github.com/suminb/datahub",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        description: "Check the health status of the API and database connection",
        tags: ["System"],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      example: "healthy",
                    },
                  },
                },
              },
            },
          },
          "503": {
            description: "Service is unhealthy",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/datasets": {
      get: {
        summary: "List all datasets",
        description: "Retrieve a paginated list of datasets with optional filtering",
        tags: ["Datasets"],
        parameters: [
          {
            name: "source_type",
            in: "query",
            description: "Filter by source type (e.g., confluence, jira, notion)",
            schema: {
              type: "string",
            },
          },
          {
            name: "status",
            in: "query",
            description: "Filter by status",
            schema: {
              type: "string",
              enum: ["active", "archived", "deleted"],
            },
          },
          {
            name: "owner",
            in: "query",
            description: "Filter by owner",
            schema: {
              type: "string",
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (default: 20, max: 100)",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          {
            name: "offset",
            in: "query",
            description: "Pagination offset",
            schema: {
              type: "integer",
              minimum: 0,
              default: 0,
            },
          },
        ],
        responses: {
          "200": {
            description: "List of datasets",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Dataset",
                      },
                    },
                    total: {
                      type: "integer",
                      description: "Total number of datasets matching the query",
                    },
                    limit: {
                      type: "integer",
                    },
                    offset: {
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new dataset",
        description: "Register a new dataset in the DataHub",
        tags: ["Datasets"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DatasetCreate",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Dataset created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Dataset",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/datasets/search": {
      get: {
        summary: "Search datasets",
        description: "Full-text search with optional fuzzy matching and filters",
        tags: ["Datasets"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query",
            schema: {
              type: "string",
            },
          },
          {
            name: "source_type",
            in: "query",
            description: "Filter by source type",
            schema: {
              type: "string",
            },
          },
          {
            name: "status",
            in: "query",
            description: "Filter by status",
            schema: {
              type: "string",
            },
          },
          {
            name: "owner",
            in: "query",
            description: "Filter by owner",
            schema: {
              type: "string",
            },
          },
          {
            name: "tags",
            in: "query",
            description: "Comma-separated list of tags",
            schema: {
              type: "string",
            },
          },
          {
            name: "fuzzy",
            in: "query",
            description: "Enable fuzzy matching (typo-tolerant)",
            schema: {
              type: "boolean",
              default: false,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Results per page (default: 20, max: 100)",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
          {
            name: "offset",
            in: "query",
            description: "Pagination offset",
            schema: {
              type: "integer",
              minimum: 0,
              default: 0,
            },
          },
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/DatasetSearchResult",
                      },
                    },
                    total: {
                      type: "integer",
                    },
                    limit: {
                      type: "integer",
                    },
                    offset: {
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request (missing query parameter)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/datasets/stats": {
      get: {
        summary: "Get aggregate statistics",
        description: "Retrieve aggregate statistics about datasets",
        tags: ["Datasets"],
        responses: {
          "200": {
            description: "Dataset statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total_datasets: {
                      type: "integer",
                      description: "Total number of datasets",
                    },
                    total_size_bytes: {
                      type: "string",
                      description: "Total size of all datasets in bytes",
                    },
                    datasets_by_source_type: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          source_type: {
                            type: "string",
                          },
                          count: {
                            type: "string",
                          },
                        },
                      },
                    },
                    datasets_by_status: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          status: {
                            type: "string",
                          },
                          count: {
                            type: "string",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
    "/datasets/{id}": {
      get: {
        summary: "Get a specific dataset",
        description: "Retrieve details of a single dataset by ID",
        tags: ["Datasets"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Dataset UUID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "200": {
            description: "Dataset details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Dataset",
                },
              },
            },
          },
          "404": {
            description: "Dataset not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      patch: {
        summary: "Update a dataset",
        description: "Update specific fields of a dataset",
        tags: ["Datasets"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Dataset UUID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DatasetUpdate",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Dataset updated successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Dataset",
                },
              },
            },
          },
          "400": {
            description: "Bad request (no fields to update)",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "404": {
            description: "Dataset not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete a dataset",
        description: "Remove a dataset from the DataHub",
        tags: ["Datasets"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Dataset UUID",
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],
        responses: {
          "204": {
            description: "Dataset deleted successfully",
          },
          "404": {
            description: "Dataset not found",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Dataset: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Unique identifier for the dataset",
          },
          name: {
            type: "string",
            description: "Dataset name",
            example: "confluence-engineering-docs",
          },
          version: {
            type: "string",
            description: "Dataset version",
            example: "1.0.0",
          },
          description: {
            type: "string",
            nullable: true,
            description: "Dataset description",
            example: "Engineering documentation from Confluence",
          },
          source_type: {
            type: "string",
            description: "Type of source system",
            example: "confluence",
          },
          source_config: {
            type: "object",
            description: "Configuration for the source system",
          },
          collected_at: {
            type: "string",
            format: "date-time",
            description: "When the dataset was collected",
          },
          collected_by: {
            type: "string",
            description: "Who or what collected the dataset",
            example: "collector-01",
          },
          collection_params: {
            type: "object",
            description: "Parameters used during collection",
          },
          item_count: {
            type: "integer",
            description: "Number of items in the dataset",
            example: 1234,
          },
          total_size_bytes: {
            type: "integer",
            description: "Total size of the dataset in bytes",
            example: 1048576,
          },
          storage_backend: {
            type: "string",
            description: "Storage backend type",
            example: "s3",
          },
          storage_path: {
            type: "string",
            description: "Path to the dataset in storage",
            example: "s3://datasets/confluence/engineering-2024",
          },
          host: {
            type: "string",
            nullable: true,
            description: "Host where the dataset is stored",
            example: "collector-01.local",
          },
          owner: {
            type: "string",
            nullable: true,
            description: "Dataset owner",
            example: "data-team",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Tags associated with the dataset",
            example: ["documentation", "engineering"],
          },
          status: {
            type: "string",
            description: "Dataset status",
            enum: ["active", "archived", "deleted"],
            example: "active",
          },
          created_at: {
            type: "string",
            format: "date-time",
            description: "When the dataset was created in DataHub",
          },
          updated_at: {
            type: "string",
            format: "date-time",
            description: "When the dataset was last updated",
          },
          checksum: {
            type: "string",
            nullable: true,
            description: "Dataset checksum",
          },
          schema_version: {
            type: "string",
            description: "Schema version",
            example: "1.0",
          },
        },
        required: ["id", "name", "source_type", "storage_backend", "storage_path"],
      },
      DatasetCreate: {
        type: "object",
        required: ["name", "source_type", "storage_backend", "storage_path"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Optional UUID (will be auto-generated if not provided)",
          },
          name: {
            type: "string",
            description: "Dataset name",
            example: "confluence-engineering-docs",
          },
          version: {
            type: "string",
            description: "Dataset version",
            example: "1.0.0",
          },
          description: {
            type: "string",
            description: "Dataset description",
            example: "Engineering documentation from Confluence",
          },
          source_type: {
            type: "string",
            description: "Type of source system",
            example: "confluence",
          },
          source_config: {
            type: "object",
            description: "Configuration for the source system",
          },
          collected_by: {
            type: "string",
            description: "Who or what collected the dataset",
            example: "collector-01",
          },
          collection_params: {
            type: "object",
            description: "Parameters used during collection",
          },
          item_count: {
            type: "integer",
            description: "Number of items in the dataset",
            example: 1234,
          },
          total_size_bytes: {
            type: "integer",
            description: "Total size of the dataset in bytes",
            example: 1048576,
          },
          storage_backend: {
            type: "string",
            description: "Storage backend type",
            example: "s3",
          },
          storage_path: {
            type: "string",
            description: "Path to the dataset in storage",
            example: "s3://datasets/confluence/engineering-2024",
          },
          host: {
            type: "string",
            description: "Host where the dataset is stored",
            example: "collector-01.local",
          },
          owner: {
            type: "string",
            description: "Dataset owner",
            example: "data-team",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Tags associated with the dataset",
            example: ["documentation", "engineering"],
          },
          status: {
            type: "string",
            description: "Dataset status",
            enum: ["active", "archived", "deleted"],
            example: "active",
          },
          checksum: {
            type: "string",
            description: "Dataset checksum",
          },
        },
      },
      DatasetUpdate: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Dataset name",
          },
          version: {
            type: "string",
            description: "Dataset version",
          },
          description: {
            type: "string",
            description: "Dataset description",
          },
          source_config: {
            type: "object",
            description: "Configuration for the source system",
          },
          collection_params: {
            type: "object",
            description: "Parameters used during collection",
          },
          item_count: {
            type: "integer",
            description: "Number of items in the dataset",
          },
          total_size_bytes: {
            type: "integer",
            description: "Total size of the dataset in bytes",
          },
          storage_path: {
            type: "string",
            description: "Path to the dataset in storage",
          },
          host: {
            type: "string",
            description: "Host where the dataset is stored",
          },
          owner: {
            type: "string",
            description: "Dataset owner",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Tags associated with the dataset",
          },
          status: {
            type: "string",
            description: "Dataset status",
            enum: ["active", "archived", "deleted"],
          },
          checksum: {
            type: "string",
            description: "Dataset checksum",
          },
        },
      },
      DatasetSearchResult: {
        allOf: [
          {
            $ref: "#/components/schemas/Dataset",
          },
          {
            type: "object",
            properties: {
              rank: {
                type: "number",
                description: "Search relevance rank",
              },
            },
          },
        ],
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Error message",
          },
          status: {
            type: "string",
            description: "Status indicator (for health check)",
          },
        },
      },
    },
  },
  tags: [
    {
      name: "System",
      description: "System health and status endpoints",
    },
    {
      name: "Datasets",
      description: "Dataset management operations",
    },
  ],
};
