"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";
import SiteBrandHeader from "@/components/SiteBrandHeader";
import { isAuthLayoutPath } from "@/lib/routes/auth";
import {
  socialAppContentClassName,
  socialAppNavClassName,
  socialAppShellAuthClassName,
  socialAppShellClassName,
} from "@/components/PageShell";

type AppShellProps = {
  children: React.ReactNode;
  layout?: "app" | "auth";
};

/** Two-column shell: scrollable content (left) + sticky TopNav column (right). */
export default function AppShell({ children, layout = "app" }: AppShellProps) {
  const pathname = usePathname();
  const useAuthLayout = layout === "auth" || isAuthLayoutPath(pathname);
  const shellClassName = useAuthLayout
    ? socialAppShellAuthClassName
    : socialAppShellClassName;

  return (
    <main className={shellClassName}>
      <div className={socialAppContentClassName}>
        {!useAuthLayout ? <SiteBrandHeader /> : null}
        {children}
      </div>
      {!useAuthLayout ? (
        <aside className={socialAppNavClassName} aria-label="Site navigation">
          <TopNav />
        </aside>
      ) : null}
    </main>
  );
}
