type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export type SectionTone =
  | "default"
  | "green"
  | "sky"
  | "amber"
  | "rose"
  | "slate"
  | "violet";

const sectionToneCardClass: Record<SectionTone, string> = {
  default: "social-section-card--default",
  green: "social-section-card--green",
  sky: "social-section-card--sky",
  amber: "social-section-card--amber",
  rose: "social-section-card--rose",
  slate: "social-section-card--slate",
  violet: "social-section-card--violet",
};

/** LINE / Facebook-style feed card surface. */
export const surfaceCardClassName = "social-surface";

/** Multi-column grids for list/topic layouts (desktop layout on all viewports). */
export const topicGridClassName = "social-topic-grid";

export const postGridClassName = "social-post-grid";

/** Social feed list — one post per row, centered (LINE / Facebook). */
export const postFeedClassName = "social-post-feed w-full";

/** Alias kept for layout imports (centered feed column). */
export const postFeedCenterClassName = postFeedClassName;

export const cardGridClassName = "social-card-grid";

export const compactLinkGridClassName = "social-compact-link-grid";

export function Card({ children, className = "" }: CardProps) {
  return <div className={`${surfaceCardClassName} ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

type FeedSectionProps = {
  title?: string;
  description?: string;
  tone?: SectionTone;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
};

/** Grouped feed block with colored top stripe (Facebook / LINE / TikTok). */
export function FeedSection({
  title,
  description,
  tone = "default",
  icon,
  children,
  className = "",
  bodyClassName = "",
  noPadding = false,
}: FeedSectionProps) {
  return (
    <section className={`social-feed-section ${className}`}>
      {title ? (
        <div className="social-section-eyebrow">
          {icon ? (
            <span className="text-base leading-none" aria-hidden>
              {icon}
            </span>
          ) : null}
          <span className="social-section-eyebrow-text">{title}</span>
        </div>
      ) : null}
      <div className={`social-section-card ${sectionToneCardClass[tone]}`}>
        {description ? (
          <div className="social-section-intro">
            <p className="text-ui-body text-sm">{description}</p>
          </div>
        ) : null}
        <div
          className={noPadding ? bodyClassName : `social-section-card-body ${bodyClassName}`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export function DividerLine({ className = "" }: { className?: string }) {
  return <div className={`social-divider ${className}`} role="separator" />;
}

type ZonePanelProps = {
  children: React.ReactNode;
  variant?: "muted" | "green" | "sky" | "amber" | "engagement" | "comments";
  className?: string;
};

export function ZonePanel({
  children,
  variant = "muted",
  className = "",
}: ZonePanelProps) {
  const variantClass =
    variant === "engagement"
      ? "social-zone--engagement"
      : variant === "comments"
        ? "social-zone--comments"
        : variant === "green"
          ? "social-zone--green social-zone px-3 py-3 sm:px-4 sm:py-3.5"
          : variant === "sky"
            ? "social-zone--sky social-zone px-3 py-3 sm:px-4 sm:py-3.5"
            : variant === "amber"
              ? "social-zone--amber social-zone px-3 py-3 sm:px-4 sm:py-3.5"
              : "social-zone--muted social-zone px-3 py-3 sm:px-4 sm:py-3.5";

  return <div className={`${variantClass} ${className}`}>{children}</div>;
}

export function ListRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`social-list-row ${className}`}>{children}</div>;
}

export function ListItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`social-list-item ${className}`}>{children}</div>;
}

export const sectionStackClassName = "social-section-stack";

import MenuIcon from "@/components/MenuIcon";

type TopicCardProps = {
  icon: string;
  title: string;
  description: string;
  tint?: string;
};

export function TopicCard({
  icon,
  title,
  description,
  tint = "bg-sky-100",
}: TopicCardProps) {
  return (
    <div className={`${surfaceCardClassName} flex h-full gap-3.5 transition active:scale-[0.99] sm:gap-4`}>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-14 sm:w-14 sm:rounded-[1.125rem] ${tint}`}
      >
        <MenuIcon icon={icon} emojiClassName="text-2xl sm:text-3xl" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="text-ui-title line-clamp-2">{title}</p>
        <p className="text-ui-caption mt-1.5 line-clamp-2 sm:mt-2">{description}</p>
      </div>
    </div>
  );
}

type TipBoxProps = {
  title: string;
  items: string[];
};

export function TipBox({ title, items }: TipBoxProps) {
  return (
    <Card className="border-l-[3px] border-l-[#06C755]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#06C755]/12 text-base">
          💡
        </span>
        <h2 className="text-ui-title min-w-0 flex-1">{title}</h2>
      </div>
      <ul className="text-ui-body space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[#06C755]">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-ui-chip min-h-10 rounded-full px-4 py-2.5 transition active:scale-95 sm:min-h-11 sm:px-5 ${
        active
          ? "bg-[#06C755] font-semibold text-white shadow-sm"
          : "bg-[#F0F2F5] font-medium text-[#050505] ring-1 ring-black/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

export const primaryButtonClassName =
  "text-ui-btn inline-flex max-w-full items-center justify-center rounded-full bg-[#06C755] px-5 py-3 font-semibold text-white shadow-sm transition active:scale-[0.97] active:bg-[#05b34c] disabled:opacity-50 sm:px-6 sm:py-3.5";

export const secondaryButtonClassName =
  "text-ui-btn inline-flex max-w-full items-center justify-center rounded-full bg-white px-5 py-3 font-semibold text-[#050505] shadow-sm ring-1 ring-black/[0.08] transition active:scale-[0.97] active:bg-[#F0F2F5] disabled:opacity-50 sm:px-6 sm:py-3.5";

export const pillButtonClassName = primaryButtonClassName;

export const pillSecondaryButtonClassName =
  "text-ui-btn inline-flex max-w-full items-center justify-center rounded-full bg-white px-4 py-2.5 font-semibold text-[#050505] shadow-sm ring-1 ring-black/[0.08] transition active:scale-95 sm:px-5 sm:py-3 lg:max-w-[14rem]";

export const compactSecondaryButtonClassName =
  "text-ui-btn social-engagement-btn w-full max-w-full !min-h-9 !rounded-full !px-4 disabled:opacity-50";

export const compactPillButtonClassName =
  "text-ui-btn inline-flex min-h-8 max-w-full items-center justify-center rounded-full bg-[#F0F2F5] px-3 py-1.5 text-xs font-semibold text-[#65676B] ring-1 ring-black/[0.05] transition active:scale-95";

export const engagementButtonClassName =
  "text-ui-btn social-engagement-btn shrink-0 disabled:cursor-not-allowed disabled:opacity-50";

export const navIconButtonClassName =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-black/[0.06] transition active:scale-95 active:bg-[#F0F2F5] sm:h-10 sm:w-10 sm:text-lg";

export const iconButtonClassName =
  "flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-black/[0.06] transition active:scale-95 active:bg-[#F0F2F5] sm:h-16 sm:w-16 sm:text-3xl";

export const toggleButtonClassName = (active: boolean) =>
  `text-ui-btn flex-1 rounded-full px-4 py-3 font-semibold transition active:scale-[0.97] ${
    active
      ? "bg-[#06C755] text-white shadow-sm"
      : "bg-[#F0F2F5] text-[#050505] ring-1 ring-black/[0.05]"
  }`;

export const dangerButtonClassName =
  "text-ui-btn inline-flex w-full items-center justify-center rounded-full bg-white py-3.5 font-semibold text-red-500 shadow-sm ring-1 ring-black/[0.06] transition active:scale-[0.97] sm:py-4";

export const settingsLinkClassName =
  "text-ui-btn flex items-center justify-between gap-3 rounded-2xl bg-[#F0F2F5] px-4 py-3.5 font-medium text-[#050505] transition active:scale-[0.99] sm:px-5 sm:py-4";

export const inputClassName = "social-input";

/** Write form panels (content, photos/video). */
export const postFormPanelClassName =
  "post-form-panel rounded-2xl bg-[#F0F2F5] p-4 ring-1 ring-black/[0.06] sm:p-5";

export const postFormTextareaClassName =
  "social-input !rounded-xl w-full resize-y !overflow-y-auto leading-relaxed !text-[#050505] !bg-white";

export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-ui-title mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button type="submit" disabled={disabled} className={`w-full ${primaryButtonClassName}`}>
      {children}
    </button>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="text-ui-body rounded-2xl bg-red-50 px-4 py-3 text-red-600 ring-1 ring-red-100">
      {message}
    </p>
  );
}
