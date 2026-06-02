import TopNav from "@/components/TopNav";
import SiteBrandHeader from "@/components/SiteBrandHeader";
import {
  socialAppContentClassName,
  socialAppNavClassName,
  socialAppShellClassName,
} from "@/components/PageShell";

type AppShellProps = {
  children: React.ReactNode;
};

/** Two-column shell: scrollable content (left) + sticky TopNav column (right). */
export default function AppShell({ children }: AppShellProps) {
  return (
    <main className={socialAppShellClassName}>
      <div className={socialAppContentClassName}>
        <SiteBrandHeader />
        {children}
      </div>
      <aside className={socialAppNavClassName} aria-label="Site navigation">
        <TopNav />
      </aside>
    </main>
  );
}
