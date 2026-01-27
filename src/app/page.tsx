"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import DatasetTable from "@/components/DatasetTable";
import SearchBox from "@/components/SearchBox";
import {
  fetchDatasets,
  fetchStats,
  searchDatasets,
  formatBytes,
  formatNumber,
  type Dataset,
  type Stats,
} from "@/lib/api";

function DashboardContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [statsData, datasetsData] = await Promise.all([
          fetchStats(),
          query ? searchDatasets({ q: query, limit: 50 }) : fetchDatasets({ limit: 50 }),
        ]);

        setStats(statsData);
        setDatasets(datasetsData.items);
        setTotal(datasetsData.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [query]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatsCard
              label="Total Datasets"
              value={formatNumber(stats.total_datasets)}
              variant="accent"
            />
            <StatsCard
              label="Total Items"
              value={formatNumber(stats.total_items)}
              variant="success"
            />
            <StatsCard
              label="Storage Used"
              value={formatBytes(stats.total_bytes)}
              variant="warning"
            />
            <StatsCard
              label="Source Types"
              value={Object.keys(stats.by_source_type).length}
              variant="info"
            />
          </div>
        )}

        {/* Search and Datasets */}
        <div className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{query ? `Search Results` : "Datasets"}</h2>
            <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[--color-text-muted]">
              {formatNumber(total)} total
            </span>
          </div>

          <div className="mb-6">
            <Suspense fallback={null}>
              <SearchBox />
            </Suspense>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-[--color-error]/20 bg-[--color-error]/5 p-6 text-center text-[--color-error]">
              {error}
            </div>
          ) : (
            <DatasetTable datasets={datasets} />
          )}
        </div>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
