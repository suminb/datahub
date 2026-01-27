import { render, screen } from "@testing-library/react";
import DatasetTable from "../DatasetTable";
import { Dataset } from "@/lib/api";

const mockDataset: Dataset = {
  id: "123",
  name: "Test Dataset",
  version: "1.0.0",
  description: "Test description",
  source_type: "notion",
  source_config: {},
  collected_at: "2024-01-15T10:00:00Z",
  collected_by: "test-user",
  collection_params: {},
  item_count: 100,
  total_size_bytes: 1048576,
  storage_backend: "s3",
  storage_path: "/data/test",
  host: "localhost",
  owner: "owner@example.com",
  tags: ["test", "dataset"],
  status: "active",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  schema_version: "1.0",
  checksum: "abc123",
};

describe("DatasetTable", () => {
  it("renders empty state when no datasets", () => {
    render(<DatasetTable datasets={[]} />);
    expect(screen.getByText("No datasets yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first dataset via the API")).toBeInTheDocument();
  });

  it("renders dataset table with data", () => {
    render(<DatasetTable datasets={[mockDataset]} />);
    expect(screen.getByText("Test Dataset")).toBeInTheDocument();
    expect(screen.getByText("notion")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("1.0 MB")).toBeInTheDocument();
    expect(screen.getByText("localhost")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders tags for datasets", () => {
    render(<DatasetTable datasets={[mockDataset]} />);
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("dataset")).toBeInTheDocument();
  });

  it("limits displayed tags to 3 and shows overflow count", () => {
    const datasetWithManyTags = {
      ...mockDataset,
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    };
    render(<DatasetTable datasets={[datasetWithManyTags]} />);
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText("tag3")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders multiple datasets", () => {
    const datasets = [mockDataset, { ...mockDataset, id: "456", name: "Second Dataset" }];
    render(<DatasetTable datasets={datasets} />);
    expect(screen.getByText("Test Dataset")).toBeInTheDocument();
    expect(screen.getByText("Second Dataset")).toBeInTheDocument();
  });

  it("displays dash for null host", () => {
    const datasetWithoutHost = { ...mockDataset, host: null };
    render(<DatasetTable datasets={[datasetWithoutHost]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
