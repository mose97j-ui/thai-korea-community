import { messages, type MessageKey } from "@/lib/i18n/messages";

type BilingualTextProps = {
  messageKey: MessageKey;
  layout?: "inline" | "stack";
  className?: string;
  secondaryClassName?: string;
};

export default function BilingualText({
  messageKey,
  layout = "inline",
  className = "",
  secondaryClassName = "text-gray-500",
}: BilingualTextProps) {
  const th = messages.th[messageKey];
  const ko = messages.ko[messageKey];

  if (layout === "stack") {
    return (
      <span className={`inline-flex flex-col gap-1 text-left ${className}`}>
        <span className="text-ui-title text-base leading-snug">{th}</span>
        <span className={`text-ui-caption ${secondaryClassName}`}>{ko}</span>
      </span>
    );
  }

  return (
    <span className={`text-ui-body inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="font-medium text-gray-900">{th}</span>
      <span className="hidden text-gray-300 sm:inline" aria-hidden>
        |
      </span>
      <span className={secondaryClassName}>{ko}</span>
    </span>
  );
}
