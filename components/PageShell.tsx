import OperatorModeBar from "@/components/OperatorModeBar";
import AppShell from "@/components/AppShell";

type PageShellProps = {
  children: React.ReactNode;
  maxWidth?: "lg" | "xl" | "2xl" | "3xl" | "5xl" | "6xl" | "7xl" | "write" | "full";
};

/** Right padding — legacy; prefer AppShell grid column instead. */
export const navReserveRightClassName =
  "pr-[calc(var(--social-nav-width)+var(--social-nav-gap))]";

/** Content area padding (nav reserve handled by AppShell grid). */
export const shellPaddingClassName =
  "pl-[var(--social-shell-pl)] pt-[var(--social-shell-pt)] pb-[var(--social-shell-pb)]";

/** Grid shell: main column + dedicated nav column (no fixed overlap). */
export const socialAppShellClassName =
  "social-page-shell social-app-shell social-feed-bg min-h-screen";

export const socialAppContentClassName = "social-app-content min-w-0 w-full";

export const socialAppNavClassName = "social-app-nav";

/** Vertical stack spacing between page blocks. */
export const socialPageStackClassName = "social-page-stack";

/** Home / sidebar layouts. */
export const socialPageStackSidebarClassName =
  "social-page-stack social-page-stack--sidebar";

/** Root layout: natural vertical + horizontal page scroll, no overlap with TopNav. */
export const socialPageShellClassName = socialAppShellClassName;

/** Main content column beside optional sidebar. */
export const socialMainColumnClassName = "social-main-column";

/** xl+ two-column layouts (map + panels, etc.). */
export const socialDualColumnGridClassName = "social-dual-column-grid";

/** Centered post list / detail column. */
export const socialPostFeedClassName = "social-post-feed";

export const socialPostFeedWrapClassName = "social-post-feed-wrap";

/** xl+ place-based board: address tree (left) + centered post feed. */
export const socialPlaceBoardRowClassName = "social-place-board-row";

export const socialPlaceSidebarColumnClassName = "social-place-sidebar-column w-full";

export const socialPlaceFeedColumnClassName = "social-place-feed-column";

/** Sticky sub-header below TopNav + page top padding. */
export const pageStickyHeaderClassName =
  "sticky top-[var(--social-sticky-top)] z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm";

export default function PageShell({
  children,
  maxWidth = "full",
}: PageShellProps) {
  const widthClass =
    maxWidth === "full"
      ? "max-w-none"
      : maxWidth === "write"
        ? "max-w-[58rem]"
        : maxWidth === "7xl"
          ? "max-w-7xl"
          : maxWidth === "6xl"
            ? "max-w-6xl"
            : maxWidth === "5xl"
              ? "max-w-5xl"
              : maxWidth === "3xl"
                ? "max-w-3xl"
                : maxWidth === "2xl"
                  ? "max-w-2xl"
                  : maxWidth === "lg"
                    ? "max-w-lg"
                    : "max-w-xl";

  const centerClass = maxWidth === "full" ? "" : "mx-auto";

  return (
    <AppShell>
      <section
        className={`${centerClass} ${widthClass} ${shellPaddingClassName}`}
      >
        <OperatorModeBar />
        {children}
      </section>
    </AppShell>
  );
}
