"use client";

import {
  compactSecondaryButtonClassName,
  dangerButtonClassName,
} from "@/components/ui";
import { useLocale } from "@/contexts/LocaleContext";

type ThreadActionBarProps = {
  blockedByMe: boolean;
  onToggleBlock: () => void;
  onDeleteThread: () => void;
  deleteLabel: string;
  className?: string;
};

/** Compact block + delete row for DM / support threads. */
export default function ThreadActionBar({
  blockedByMe,
  onToggleBlock,
  onDeleteThread,
  deleteLabel,
  className = "",
}: ThreadActionBarProps) {
  const { t } = useLocale();

  return (
    <div
      className={`flex flex-wrap items-center justify-end gap-2 border-b border-black/[0.06] bg-[#F8F9FA] px-3 py-2 ${className}`.trim()}
    >
      <button
        type="button"
        onClick={onToggleBlock}
        className={`${compactSecondaryButtonClassName} !px-3 !py-1.5 text-xs`}
      >
        {blockedByMe ? t("social.unblockUser") : t("social.blockUser")}
      </button>
      <button
        type="button"
        onClick={onDeleteThread}
        className={`${dangerButtonClassName} !px-3 !py-1.5 text-xs`}
      >
        {deleteLabel}
      </button>
    </div>
  );
}
