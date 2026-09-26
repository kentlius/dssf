import { cva } from "class-variance-authority";

/** Stock status badge: icon-only (✓ / ✕ / ?), color carries the meaning. */
export const statusBadge = cva(
  "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white",
  {
    variants: {
      status: {
        ari: "bg-green-600",
        nashi: "bg-red-600",
        toiawase: "bg-amber-600",
        other: "bg-zinc-500",
      },
    },
    defaultVariants: { status: "other" },
  },
);

export type StatusVariant = "ari" | "nashi" | "toiawase" | "other";

export function toStatusVariant(status: string): StatusVariant {
  if (status === "あり") return "ari";
  if (status === "なし") return "nashi";
  if (status === "店舗問合せ") return "toiawase";
  return "other";
}

/** Region chip for the scrollable region picker. */
export const regionChip = cva(
  "flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold",
  {
    variants: {
      selected: {
        true: "border-sky-500 bg-sky-50 text-sky-700",
        false: "border-zinc-200 text-zinc-600",
      },
    },
    defaultVariants: { selected: false },
  },
);

