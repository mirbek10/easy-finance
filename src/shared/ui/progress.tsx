"use client";

export function Progress({
  value,
  color = "green",
  label,
}: {
  value: number;
  color?: string;
  label: string;
}) {
  return (
    <div
      className={`progress ${color}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.max(0, Math.min(100, value))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
