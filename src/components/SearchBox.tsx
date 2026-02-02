"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchBoxProps {
  placeholder?: string;
}

export default function SearchBox({ placeholder = "Search datasets..." }: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query !== (searchParams.get("q") || "")) {
        handleSearch(query);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, handleSearch, searchParams]);

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[--color-text-muted]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[--color-border] bg-[--color-bg-tertiary] py-3 pl-12 pr-4 font-[family-name:var(--font-geist-mono)] text-sm text-[--color-text-primary] placeholder-[--color-text-muted] transition-all focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/20"
      />
    </div>
  );
}
