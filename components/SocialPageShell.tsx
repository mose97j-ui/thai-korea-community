import AppShell from "@/components/AppShell";
import OperatorModeBar from "@/components/OperatorModeBar";
import { shellPaddingClassName } from "@/components/PageShell";

type SocialPageShellProps = {
  children: React.ReactNode;
};

/** Full-width social screens; page scrolls naturally (no locked viewport). */
export default function SocialPageShell({ children }: SocialPageShellProps) {
  return (
    <AppShell>
      <section className={shellPaddingClassName}>
        <OperatorModeBar />
        {children}
      </section>
    </AppShell>
  );
}
