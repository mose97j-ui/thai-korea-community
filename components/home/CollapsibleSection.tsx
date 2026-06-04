"use client";

import { memo, useState, type ReactNode } from "react";
import { useLocale } from "@/contexts/LocaleContext";

type CollapsibleSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: "surface" | "plain";
  headerExtra?: ReactNode;
};

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
  className = "",
  bodyClassName = "",
  variant = "surface",
  headerExtra,
}: CollapsibleSectionProps) {
  const { t } = useLocale();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = onOpenChange !== undefined && open !== undefined;
  const isOpen = controlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (controlled) {
      onOpenChange(next);
    } else {
      setInternalOpen(next);
    }
  };

  return (
    <section
      className={`social-collapsible-section ${
        isOpen ? "" : "social-collapsible-section--closed"
      } ${variant === "surface" ? "social-collapsible-section--surface" : ""} ${className}`.trim()}
    >
      <div className="social-collapsible-section__header">
        <button
          type="button"
          className="social-collapsible-section__summary min-w-0 flex-1 text-left"
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
        >
          <div className="social-collapsible-section__titles min-w-0 flex-1">
            <span className="social-collapsible-section__title">{title}</span>
            {description ? (
              <span className="social-collapsible-section__desc">{description}</span>
            ) : null}
          </div>
          <span className="sr-only">{t("home.sectionToggleHint")}</span>
        </button>
        {headerExtra ? (
          <div className="social-collapsible-section__extra shrink-0">{headerExtra}</div>
        ) : null}
      </div>
      <div
        className={`social-collapsible-section__body ${bodyClassName}`.trim()}
        hidden={!isOpen}
      >
        {children}
      </div>
    </section>
  );
}

export default memo(CollapsibleSection);
