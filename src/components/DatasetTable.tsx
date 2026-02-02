"use client";

import Link from "next/link";
import { Dataset, formatBytes, formatDate, formatNumber } from "@/lib/api";

interface DatasetTableProps {
  datasets: Dataset[];
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded border border-[--color-border] bg-[--color-bg-tertiary] px-1.5 py-0.5 font-[family-name:var(--font-geist-mono)] text-xs text-[--color-text-muted]">
      {children}
    </span>
  );
}

export default function DatasetTable({ datasets }: DatasetTableProps) {
  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-[--color-border] bg-[--color-bg-secondary] p-12 text-center">
        <div className="text-4xl opacity-40">📦</div>
        <p className="mt-4 text-[--color-text-muted]">No datasets yet</p>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Create your first dataset via the API
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[--color-border] bg-[--color-bg-secondary]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[--color-border] bg-[--color-bg-tertiary]">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Source
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Items
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Size
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Host
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-border]">
            {datasets.map((dataset) => (
              <tr key={dataset.id} className="transition-colors hover:bg-[--color-bg-hover]">
                <td className="px-5 py-4">
                  <Link
                    href={`/datasets/${dataset.id}`}
                    className="font-[family-name:var(--font-geist-mono)] font-medium text-[--color-accent] hover:underline"
                  >
                    {dataset.name}
                  </Link>
                  {dataset.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {dataset.tags.slice(0, 3).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                      {dataset.tags.length > 3 && <Tag>+{dataset.tags.length - 3}</Tag>}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <SourceBadge source={dataset.source_type} />
                </td>
                <td className="px-5 py-4 text-right font-[family-name:var(--font-geist-mono)] text-sm">
                  {formatNumber(dataset.item_count)}
                </td>
                <td className="px-5 py-4 text-right font-[family-name:var(--font-geist-mono)] text-sm text-[--color-text-secondary]">
                  {formatBytes(dataset.total_size_bytes)}
                </td>
                <td className="px-5 py-4 font-[family-name:var(--font-geist-mono)] text-sm text-[--color-text-secondary]">
                  {dataset.host || "—"}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={dataset.status} />
                </td>
                <td className="px-5 py-4 font-[family-name:var(--font-geist-mono)] text-sm text-[--color-text-muted]">
                  {formatDate(dataset.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
