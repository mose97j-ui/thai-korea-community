"use client";

import { useEffect, useState } from "react";
import { ErrorMessage, FormField, inputClassName } from "@/components/ui";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { useLocale } from "@/contexts/LocaleContext";
import { fetchAddressSuggestions, fetchGeocode } from "@/lib/maps/clientGeocode";
import { buildDisplayAddress } from "@/lib/maps/formatAddress";

export type KakaoAddressValue = {
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  displayAddress?: string;
  mapLat?: number;
  mapLng?: number;
};

type KakaoAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onResolved?: (value: KakaoAddressValue) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
};

type Suggestion = {
  label: string;
  roadAddress: string;
  jibunAddress: string;
  displayAddress: string;
  lat: number;
  lng: number;
};

export default function KakaoAddressField({
  value,
  onChange,
  onResolved,
  label,
  required = false,
  placeholder,
}: KakaoAddressFieldProps) {
  const { t } = useLocale();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState("");
  const [error, setError] = useState("");

  useDebouncedEffect(
    () => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }

      void fetchAddressSuggestions(trimmed).then((items) => {
        setSuggestions(items);
        setOpen(items.length > 0);
      });
    },
    [value],
    250
  );

  useEffect(() => {
    if (!value.trim()) {
      setResolvedLabel("");
    }
  }, [value]);

  const applySuggestion = (item: Suggestion) => {
    const displayAddress =
      item.displayAddress ||
      buildDisplayAddress({
        roadAddress: item.roadAddress,
        jibunAddress: item.jibunAddress,
        fallback: item.label,
      });

    onChange(displayAddress);
    setResolvedLabel(displayAddress);
    setOpen(false);
    setSuggestions([]);
    onResolved?.({
      address: displayAddress,
      roadAddress: item.roadAddress,
      jibunAddress: item.jibunAddress,
      displayAddress,
      mapLat: item.lat || undefined,
      mapLng: item.lng || undefined,
    });
  };

  const resolveCurrentValue = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setResolving(true);
    setError("");

    const geocode = await fetchGeocode(trimmed);
    setResolving(false);

    if (!geocode) {
      setError(t("map.resolveFailed"));
      return;
    }

    const displayAddress = geocode.displayAddress || trimmed;
    onChange(displayAddress);
    setResolvedLabel(displayAddress);
    onResolved?.({
      address: displayAddress,
      roadAddress: geocode.roadAddress,
      jibunAddress: geocode.jibunAddress,
      displayAddress,
      mapLat: geocode.lat || undefined,
      mapLng: geocode.lng || undefined,
    });
  };

  return (
    <FormField label={label ?? t("post.address")}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setError("");
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void resolveCurrentValue();
            }
          }}
          placeholder={placeholder ?? t("search.addressPlaceholder")}
          className={inputClassName}
          required={required}
        />

        {open && suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((item) => (
              <li key={`${item.displayAddress}-${item.lat}-${item.lng}`}>
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySuggestion(item)}
                >
                  <span className="block font-medium text-gray-900">{item.displayAddress}</span>
                  {item.roadAddress && item.jibunAddress && item.roadAddress !== item.jibunAddress ? (
                    <span className="mt-1 block text-xs text-gray-500">
                      {t("map.jibunLabel")}: {item.jibunAddress}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {resolvedLabel ? (
        <p className="mt-2 text-sm text-[#06C755]">
          {t("map.resolvedAddress")}: {resolvedLabel}
        </p>
      ) : null}

      {resolving ? (
        <p className="mt-2 text-sm text-gray-500">{t("map.resolving")}</p>
      ) : null}

      {error ? (
        <div className="mt-2">
          <ErrorMessage message={error} />
        </div>
      ) : null}

      <p className="mt-2 text-xs text-gray-500">{t("map.addressHint")}</p>
    </FormField>
  );
}
