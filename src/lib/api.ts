const API_BASE = "";

export interface Dataset {
  id: string;
  name: string;
  version: string;
  description: string | null;
  source_type: string;
  source_config: Record<string, unknown>;
  collected_at: string;
  collected_by: string;
  collection_params: Record<string, unknown>;
  item_count: number;
  total_size_bytes: number;
  storage_backend: string;
  storage_path: string;
  host: string | null;
  owner: string | null;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
  schema_version: string;
  checksum: string | null;
}

export interface DatasetSearchResult extends Dataset {
  relevance_score: number | null;
}

export interface PaginatedResponse {
  items: Dataset[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  items: DatasetSearchResult[];
  total: number;
  query: string;
}

export interface Stats {
  total_datasets: number;
  total_items: number;
  total_bytes: number;
  by_source_type: Record<string, number>;
  by_status: Record<string, number>;
}

export async function fetchDatasets(params?: {
  source_type?: string;
  status?: string;
  owner?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.source_type) searchParams.set("source_type", params.source_type);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.owner) searchParams.set("owner", params.owner);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const url = `${API_BASE}/api/datasets${searchParams.toString() ? `?${searchParams}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch datasets");
  return res.json();
}

export async function fetchDataset(id: string): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/api/datasets/${id}`);
  if (!res.ok) throw new Error("Dataset not found");
  return res.json();
}

export async function searchDatasets(params: {
  q: string;
  source_type?: string;
  status?: string;
  owner?: string;
  tags?: string;
  fuzzy?: boolean;
  limit?: number;
  offset?: number;
}): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", params.q);
  if (params.source_type) searchParams.set("source_type", params.source_type);
  if (params.status) searchParams.set("status", params.status);
  if (params.owner) searchParams.set("owner", params.owner);
  if (params.tags) searchParams.set("tags", params.tags);
  if (params.fuzzy) searchParams.set("fuzzy", "true");
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.offset) searchParams.set("offset", params.offset.toString());

  const res = await fetch(`${API_BASE}/api/datasets/search?${searchParams}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_BASE}/api/datasets/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function updateDataset(
  id: string,
  updates: Partial<Pick<Dataset, "name" | "version" | "description" | "owner" | "tags" | "status">>
): Promise<Dataset> {
  const res = await fetch(`${API_BASE}/api/datasets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update dataset");
  return res.json();
}

export async function deleteDataset(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/datasets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete dataset");
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
