interface StatsCardProps {
  label: string;
  value: string | number;
  variant?: "default" | "accent" | "success" | "warning" | "info";
}

const variantStyles = {
  default: "text-[--color-text-primary]",
  accent: "text-[--color-accent]",
  success: "text-[--color-success]",
  warning: "text-[--color-warning]",
  info: "text-[--color-info]",
};

export default function StatsCard({ label, value, variant = "default" }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-bg-secondary] p-5 transition-all hover:border-[--color-border-hover] hover:shadow-lg hover:shadow-black/20">
      <p className="text-xs font-medium uppercase tracking-wider text-[--color-text-muted]">
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-geist-mono)] text-2xl font-semibold ${variantStyles[variant]}`}
      >
        {value}
      </p>
    </div>
  );
}
