"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[--color-border] bg-[--color-bg-secondary]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[--color-accent] to-[--color-accent-hover] text-[--color-bg-primary] font-semibold">
            D
          </div>
          <span className="text-xl font-semibold tracking-tight">DataHub</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-[--color-accent-muted] text-[--color-accent]"
                : "text-[--color-text-secondary] hover:bg-[--color-bg-hover] hover:text-[--color-text-primary]"
            }`}
          >
            Dashboard
          </Link>
          <a
            href="/api/datasets"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-4 py-2 text-sm font-medium text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-hover] hover:text-[--color-text-primary]"
          >
            API
          </a>
        </nav>
      </div>
    </header>
  );
}
