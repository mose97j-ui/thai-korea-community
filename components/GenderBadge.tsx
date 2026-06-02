import type { Gender } from "@/lib/auth/types";

type GenderBadgeProps = {
  gender: Gender;
  label: string;
  compact?: boolean;
  className?: string;
};

export default function GenderBadge({
  gender,
  label,
  compact = false,
  className = "",
}: GenderBadgeProps) {
  const isMale = gender === "male";

  return (
    <span
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-bold leading-none ${
        compact ? "px-1.5 py-0.5 text-sm" : "px-2 py-1 text-base"
      } ${
        isMale
          ? "bg-sky-100 text-sky-700 ring-1 ring-sky-200"
          : "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
      } ${className}`}
    >
      {isMale ? "♂" : "♀"} {label}
    </span>
  );
}
