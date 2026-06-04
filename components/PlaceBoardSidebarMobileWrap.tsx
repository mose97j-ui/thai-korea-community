"use client";

import { useLocale } from "@/contexts/LocaleContext";
import PlaceBoardSidebar, {
  type PlaceBoardSidebarProps,
} from "@/components/PlaceBoardSidebar";

/** Mobile: collapsible address panel; desktop: sidebar column unchanged. */
export default function PlaceBoardSidebarMobileWrap(props: PlaceBoardSidebarProps) {
  const { t } = useLocale();

  return (
    <div className="social-place-sidebar-wrap">
      <details className="social-place-sidebar-details lg:hidden" open>
        <summary className="social-place-sidebar-details__summary">
          <span className="text-sm font-bold text-gray-900">
            {t("post.mobileAddressPanel")}
          </span>
          <span className="text-xs font-medium text-[#06C755]">
            {t("post.mobileAddressPanelHint")}
          </span>
        </summary>
        <div className="social-place-sidebar-details__body">
          <PlaceBoardSidebar {...props} />
        </div>
      </details>
      <div className="hidden lg:block">
        <PlaceBoardSidebar {...props} />
      </div>
    </div>
  );
}
