import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
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
  },
  apis: ["./src/app/api/**/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
