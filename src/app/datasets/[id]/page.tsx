"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import {
  fetchDataset,
  updateDataset,
  formatBytes,
  formatNumber,
  formatDateTime,
  type Dataset,
} from "@/lib/api";

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-bg-secondary] overflow-hidden">
      <div className="border-b border-[--color-border] bg-[--color-bg-tertiary] px-5 py-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[--color-border] last:border-0">
      <span className="text-sm text-[--color-text-muted]">{label}</span>
      <span className="text-sm font-[family-name:var(--font-geist-mono)] text-[--color-text-primary] text-right max-w-[60%] break-all">
        {value}
      </span>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-[--color-border] bg-[--color-bg-tertiary] px-2 py-1 text-xs font-medium text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-hover] hover:text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent] focus:ring-offset-1 focus:ring-offset-[--color-bg-secondary]"
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <span aria-hidden>✓</span>
          <span>Copied</span>
        </>
      ) : (
        <>
          <span aria-hidden>⎘</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  if (Object.keys(data).length === 0) {
    return <p className="text-sm text-[--color-text-muted]">No data</p>;
  }

  return (
    <pre className="rounded-lg bg-[--color-bg-primary] border border-[--color-border] p-4 font-[family-name:var(--font-geist-mono)] text-xs text-[--color-text-secondary] overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-[--color-border] bg-[--color-bg-tertiary] px-2 py-1 font-[family-name:var(--font-geist-mono)] text-xs text-[--color-text-secondary]">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20",
    archived: "bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20",
    deleted: "bg-[--color-error]/10 text-[--color-error] border-[--color-error]/20",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-xs ${styles[status] || styles.active}`}
    >
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex rounded-md border border-[--color-accent]/20 bg-[--color-accent]/10 px-2 py-0.5 font-[family-name:var(--font-geist-mono)] text-xs text-[--color-accent]">
      {source}
    </span>
  );
}

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    async function loadDataset() {
      try {
        const data = await fetchDataset(id);
        setDataset(data);
        // Initialize edit fields
        setEditName(data.name);
        setEditVersion(data.version);
        setEditDescription(data.description || "");
        setEditOwner(data.owner || "");
        setEditTags(data.tags.join(", "));
        setEditStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dataset");
      } finally {
        setLoading(false);
      }
    }

    loadDataset();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
    setSaveMessage(null);
  };

  const handleCancel = () => {
    if (dataset) {
      setEditName(dataset.name);
      setEditVersion(dataset.version);
      setEditDescription(dataset.description || "");
      setEditOwner(dataset.owner || "");
      setEditTags(dataset.tags.join(", "));
      setEditStatus(dataset.status);
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!dataset) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updates = {
        name: editName,
        version: editVersion,
        description: editDescription || null,
        owner: editOwner || null,
        tags: editTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        status: editStatus,
      };

      const updatedDataset = await updateDataset(id, updates);
      setDataset(updatedDataset);
      setIsEditing(false);
      setSaveMessage({
        type: "success",
        text: "Dataset updated successfully!",
      });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update dataset",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
          </div>
        </main>
      </>
    );
  }

  if (error || !dataset) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-xl border border-[--color-error]/20 bg-[--color-error]/5 p-6 text-center text-[--color-error]">
            {error || "Dataset not found"}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-[--color-text-muted] hover:text-[--color-accent]">
            ← Back to Datasets
          </Link>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 ${
              saveMessage.type === "success"
                ? "border-[--color-success]/20 bg-[--color-success]/10 text-[--color-success]"
                : "border-[--color-error]/20 bg-[--color-error]/10 text-[--color-error]"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full font-[family-name:var(--font-geist-mono)] text-3xl font-semibold bg-[--color-bg-secondary] border border-[--color-border] rounded-lg px-3 py-2 text-[--color-text-primary] focus:outline-none focus:border-[--color-accent]"
                />
              ) : (
                <h1 className="font-[family-name:var(--font-geist-mono)] text-3xl font-semibold">
                  {dataset.name}
                </h1>
              )}
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-bg-tertiary] px-4 py-2 text-sm font-medium text-[--color-text-primary] transition-colors hover:bg-[--color-bg-hover]"
              >
                Edit
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SourceBadge source={dataset.source_type} />
            {isEditing ? (
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="rounded-md border border-[--color-border] bg-[--color-bg-secondary] px-2 py-1 font-[family-name:var(--font-geist-mono)] text-xs text-[--color-text-primary] focus:outline-none focus:border-[--color-accent]"
              >
                <option value="active">active</option>
                <option value="archived">archived</option>
                <option value="deleted">deleted</option>
              </select>
            ) : (
              <StatusBadge status={dataset.status} />
            )}
            {isEditing ? (
              <input
                type="text"
                value={editVersion}
                onChange={(e) => setEditVersion(e.target.value)}
                placeholder="Version"
                className="w-24 rounded-md border border-[--color-border] bg-[--color-bg-secondary] px-2 py-1 font-[family-name:var(--font-geist-mono)] text-xs text-[--color-text-primary] focus:outline-none focus:border-[--color-accent]"
              />
            ) : (
              <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[--color-text-muted]">
                v{dataset.version}
              </span>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="mt-4 w-full max-w-3xl rounded-lg border border-[--color-border] bg-[--color-bg-secondary] px-3 py-2 text-[--color-text-secondary] leading-relaxed focus:outline-none focus:border-[--color-accent]"
            />
          ) : (
            dataset.description && (
              <p className="mt-4 max-w-3xl text-[--color-text-secondary] leading-relaxed">
                {dataset.description}
              </p>
            )
          )}

          {isEditing ? (
            <div className="mt-4">
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full max-w-xl rounded-md border border-[--color-border] bg-[--color-bg-secondary] px-3 py-2 text-sm text-[--color-text-primary] focus:outline-none focus:border-[--color-accent]"
              />
            </div>
          ) : (
            dataset.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {dataset.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            )
          )}

          {isEditing && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-[--color-accent] bg-[--color-accent] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-bg-tertiary] px-4 py-2 text-sm font-medium text-[--color-text-primary] transition-colors hover:bg-[--color-bg-hover] disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Detail Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <DetailCard title="Overview">
            <div className="flex items-start justify-between gap-3 py-2 border-b border-[--color-border]">
              <span className="text-sm text-[--color-text-muted] flex-shrink-0">ID</span>
              <span className="flex items-center gap-2 text-sm font-[family-name:var(--font-geist-mono)] text-[--color-text-primary] min-w-0 text-right">
                <span className="whitespace-nowrap overflow-x-auto min-w-0">{dataset.id}</span>
                <span className="flex-shrink-0">
                  <CopyButton text={dataset.id} />
                </span>
              </span>
            </div>
            <DetailRow label="Items" value={formatNumber(dataset.item_count)} />
            <DetailRow label="Size" value={formatBytes(dataset.total_size_bytes)} />
            <DetailRow label="Checksum" value={dataset.checksum || "—"} />
          </DetailCard>

          <DetailCard title="Storage">
            <DetailRow label="Backend" value={dataset.storage_backend} />
            <DetailRow label="Path" value={dataset.storage_path} />
            <DetailRow label="Host" value={dataset.host || "—"} />
          </DetailCard>

          <DetailCard title="Ownership">
            {isEditing ? (
              <div className="py-2">
                <label className="block text-sm text-[--color-text-muted] mb-2">Owner</label>
                <input
                  type="text"
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  placeholder="Owner"
                  className="w-full rounded-md border border-[--color-border] bg-[--color-bg-primary] px-3 py-2 text-sm text-[--color-text-primary] font-[family-name:var(--font-geist-mono)] focus:outline-none focus:border-[--color-accent]"
                />
                <div className="mt-4">
                  <DetailRow label="Collected By" value={dataset.collected_by} />
                </div>
              </div>
            ) : (
              <>
                <DetailRow label="Owner" value={dataset.owner || "—"} />
                <DetailRow label="Collected By" value={dataset.collected_by} />
              </>
            )}
          </DetailCard>

          <DetailCard title="Timeline">
            <DetailRow label="Collected At" value={formatDateTime(dataset.collected_at)} />
            <DetailRow label="Created At" value={formatDateTime(dataset.created_at)} />
            <DetailRow label="Updated At" value={formatDateTime(dataset.updated_at)} />
          </DetailCard>

          <DetailCard title="Source Config">
            <JsonBlock data={dataset.source_config} />
          </DetailCard>

          <DetailCard title="Collection Parameters">
            <JsonBlock data={dataset.collection_params} />
          </DetailCard>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <a
            href={`/api/datasets/${dataset.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-bg-tertiary] px-4 py-2 text-sm font-medium text-[--color-text-primary] transition-colors hover:bg-[--color-bg-hover]"
          >
            View JSON
          </a>
        </div>
      </main>
    </>
  );
}
