import PageShell from "@/components/PageShell";

type AuthPageShellProps = {
  children: React.ReactNode;
  maxWidth?: "lg" | "xl" | "2xl";
  /** Vertically center short entry screens (welcome, login). */
  centerContent?: boolean;
  /** Long forms — horizontal center, scroll from top. */
  topAligned?: boolean;
};

/** Centered onboarding shell — no TopNav, matches welcome/login/signup form style. */
export default function AuthPageShell({
  children,
  maxWidth = "2xl",
  centerContent = true,
  topAligned = false,
}: AuthPageShellProps) {
  return (
    <PageShell
      maxWidth={maxWidth}
      layout="auth"
      centerContent={centerContent}
      topAligned={topAligned}
    >
      {children}
    </PageShell>
  );
}
