"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { pillButtonClassName } from "@/components/ui";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { useLocale } from "@/contexts/LocaleContext";
import { fetchAddressSuggestions } from "@/lib/maps/clientGeocode";
import { validateKoreanAddress } from "@/lib/posts/address";

type GlobalSearchBarProps = {
  initialQuery?: string;
  className?: string;
  autoFocus?: boolean;
};

type Suggestion = {
  label: string;
  displayAddress: string;
};

export default function GlobalSearchBar({
  initialQuery = "",
  className = "",
  autoFocus = false,
}: GlobalSearchBarProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  useDebouncedEffect(
    () => {
      const trimmed = query.trim();
      if (trimmed.length < 2 || !validateKoreanAddress(trimmed)) {
        setSuggestions([]);
        return;
      }

      void fetchAddressSuggestions(trimmed).then((items) => {
        setSuggestions(
          items.map((item) => ({
            label: item.displayAddress,
            displayAddress: item.displayAddress,
          }))
        );
        setOpen(items.length > 0);
      });
    },
    [query],
    250
  );

  const goSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
    goSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="social-surface flex flex-wrap items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        <span className="text-lg text-[#65676B] sm:text-xl" aria-hidden>
          🔍
        </span>
        <input
          name="q"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          placeholder={t("search.placeholder")}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent text-[#050505] outline-none placeholder:text-[#8A8D91]"
        />
        <button
          type="submit"
          className={`shrink-0 ${pillButtonClassName} !px-4 !py-2 !text-sm sm:!px-5 sm:!py-2.5`}
        >
          {t("common.search")}
        </button>
      </div>

      {open && suggestions.length > 0 ? (
        <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          <li className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
            {t("search.addressSuggestions")}
          </li>
          {suggestions.map((item) => (
            <li key={item.displayAddress}>
              <button
                type="button"
                className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(item.displayAddress);
                  setOpen(false);
                  goSearch(item.displayAddress);
                }}
              >
                <span className="font-medium text-gray-900">{item.displayAddress}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
