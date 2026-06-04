"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, SectionLabel, inputClassName } from "@/components/ui";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import { useLocale } from "@/contexts/LocaleContext";
import { fetchAddressSuggestions } from "@/lib/maps/clientGeocode";
import { getHomeCategoryById } from "@/lib/categories/registry";
import {
  getAddressClassificationLevels,
  isValidAddressPart,
  type AddressSearchClassification,
  type AddressTreeNode,
} from "@/lib/posts/addressParse";

export type PlaceBoardSidebarProps = {
  categoryId: string;
  addressTree: AddressTreeNode[];
  selectedTreeKey: string | null;
  onTreeSelect: (treeKey: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchClassification: AddressSearchClassification | null;
  isResolvingSearch?: boolean;
  totalPosts: number;
  isEnriching?: boolean;
};

function AddressTreeList({
  nodes,
  depth,
  selectedTreeKey,
  expandedKeys,
  onToggle,
  onSelect,
  countLabel,
}: {
  nodes: AddressTreeNode[];
  depth: number;
  selectedTreeKey: string | null;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  onSelect: (key: string) => void;
  countLabel: (count: number) => string;
}) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1 border-l border-gray-100 pl-2"}>
      {nodes.map((node) => {
        const active = selectedTreeKey === node.key;
        const hasChildren = node.children.length > 0;
        const expanded = expandedKeys.has(node.key);

        return (
          <li key={node.key}>
            <div className="flex items-stretch gap-1">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onToggle(node.key)}
                  aria-label={expanded ? "collapse" : "expand"}
                  className="flex h-10 w-7 shrink-0 items-center justify-center rounded-lg text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  {expanded ? "▾" : "▸"}
                </button>
              ) : (
                <span className="w-7 shrink-0" aria-hidden />
              )}

              <button
                type="button"
                onClick={() => onSelect(node.key)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition active:scale-[0.99] ${
                  active
                    ? "bg-[#06C755] text-white shadow-sm ring-2 ring-[#06C755]/25"
                    : "bg-[#F0F2F5] text-gray-800 ring-1 ring-black/[0.06] hover:bg-gray-100"
                }`}
                style={{ marginLeft: depth > 0 ? 0 : undefined }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold leading-snug">
                    {node.label}
                  </span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      active ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {countLabel(node.postCount)}
                  </span>
                </span>
                {active && (
                  <span className="shrink-0 text-xs font-bold text-white/90">✓</span>
                )}
              </button>
            </div>

            {hasChildren && expanded && (
              <AddressTreeList
                nodes={node.children}
                depth={depth + 1}
                selectedTreeKey={selectedTreeKey}
                expandedKeys={expandedKeys}
                onToggle={onToggle}
                onSelect={onSelect}
                countLabel={countLabel}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ClassificationRow({
  step,
  label,
  value,
  active,
}: {
  step: string;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ring-1 ${
        active
          ? "bg-white ring-[#06C755]/30"
          : "bg-white/70 ring-black/[0.04] text-gray-400"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {step}. {label}
      </p>
      <p className={`mt-0.5 truncate text-sm font-semibold ${active ? "text-gray-900" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export default function PlaceBoardSidebar({
  categoryId,
  addressTree,
  selectedTreeKey,
  onTreeSelect,
  searchQuery,
  onSearchChange,
  searchClassification,
  isResolvingSearch = false,
  totalPosts,
  isEnriching = false,
}: PlaceBoardSidebarProps) {
  const { t, pick } = useLocale();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<
    Array<{ displayAddress: string; label: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const category = getHomeCategoryById(categoryId);
  const emptyLevel = t("post.addressLevelEmpty");

  const classificationLevels = useMemo(
    () =>
      searchClassification
        ? getAddressClassificationLevels(searchClassification.parts, emptyLevel)
        : null,
    [searchClassification, emptyLevel]
  );

  useDebouncedEffect(
    () => {
      const trimmed = searchQuery.trim();
      if (trimmed.length < 2) {
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
      });
    },
    [searchQuery],
    250
  );

  useEffect(() => {
    if (!selectedTreeKey && !searchClassification) {
      return;
    }

    setExpandedKeys((current) => {
      const next = new Set(current);
      const key = selectedTreeKey ?? "";

      if (key.startsWith("dong:")) {
        const [, payload] = key.split("dong:");
        const [sido, sigungu] = (payload ?? "").split("|");
        if (sido) {
          next.add(`sido:${sido}`);
        }
        if (sido && sigungu) {
          next.add(`sigungu:${sido}|${sigungu}`);
        }
      } else if (key.startsWith("sigungu:")) {
        const [, payload] = key.split("sigungu:");
        const [sido] = (payload ?? "").split("|");
        if (sido) {
          next.add(`sido:${sido}`);
        }
      } else if (searchClassification) {
        const { parts } = searchClassification;
        if (isValidAddressPart(parts.sido)) {
          next.add(`sido:${parts.sido}`);
        }
        if (isValidAddressPart(parts.sigungu)) {
          next.add(`sigungu:${parts.sido}|${parts.sigungu}`);
        }
      }

      return next;
    });
  }, [selectedTreeKey, searchClassification]);

  const countLabel = useMemo(
    () => (count: number) => t("post.addressCount").replace("{count}", String(count)),
    [t]
  );

  const toggleExpanded = (key: string) => {
    setExpandedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Card className="p-3">
      <div className="mb-4 shrink-0 rounded-2xl bg-[#F8F9FA] p-3 ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-3">
          {category && (
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-xl ${category.tint}`}
            >
              {category.icon}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">
              {category ? pick(category.label) : categoryId}
            </p>
            <p className="text-xs text-gray-500">
              {t("post.sidebarTotal").replace("{count}", String(totalPosts))}
            </p>
          </div>
        </div>
      </div>

      <section className="relative mb-4 shrink-0">
        <SectionLabel>{t("post.addressSearch")}</SectionLabel>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setShowSuggestions(false), 150);
          }}
          placeholder={t("post.addressSearchPlaceholder")}
          className={`mt-2 ${inputClassName}`}
        />
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          {t("post.addressSearchHint")}
        </p>

        {showSuggestions && suggestions.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((item) => (
              <li key={item.displayAddress}>
                <button
                  type="button"
                  className="block w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSearchChange(item.displayAddress);
                    setShowSuggestions(false);
                  }}
                >
                  {item.displayAddress}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {(searchClassification || isResolvingSearch) && (
        <section className="mb-4 shrink-0 rounded-2xl bg-[#06C755]/5 p-3 ring-1 ring-[#06C755]/20">
          <p className="text-xs font-semibold text-[#06C755]">
            {t("post.addressAutoClassified")}
          </p>

          {isResolvingSearch ? (
            <p className="mt-2 text-sm text-gray-500">{t("map.resolving")}</p>
          ) : classificationLevels ? (
            <div className="mt-3 space-y-2">
              <ClassificationRow
                step="1"
                label={t("post.addressLevelSido")}
                value={classificationLevels.sido}
                active={classificationLevels.sido !== emptyLevel}
              />
              <ClassificationRow
                step="2"
                label={t("post.addressLevelSigungu")}
                value={classificationLevels.sigungu}
                active={classificationLevels.sigungu !== emptyLevel}
              />
              <ClassificationRow
                step="3"
                label={t("post.addressLevelDong")}
                value={classificationLevels.dong}
                active={classificationLevels.dong !== emptyLevel}
              />
            </div>
          ) : null}

          {searchClassification?.displayAddress ? (
            <p className="mt-3 text-sm font-medium leading-snug text-gray-900">
              {searchClassification.displayAddress}
            </p>
          ) : null}

          {searchClassification?.roadAddress &&
          searchClassification.jibunAddress &&
          searchClassification.roadAddress !== searchClassification.jibunAddress ? (
            <p className="mt-1 text-xs text-gray-500">
              {t("map.jibunLabel")}: {searchClassification.jibunAddress}
            </p>
          ) : null}
        </section>
      )}

      <div className="mb-3 shrink-0 border-t border-gray-100" />

      <section>
        <SectionLabel>
          {searchClassification ? t("post.byAddressFiltered") : t("post.byAddress")}
        </SectionLabel>

        {(selectedTreeKey || searchQuery.trim()) && (
          <button
            type="button"
            onClick={() => {
              onTreeSelect(null);
              onSearchChange("");
            }}
            className="mb-2 w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[#06C755] ring-1 ring-[#06C755]/20 transition hover:bg-[#06C755]/5"
          >
            {t("post.showAllAddresses")}
          </button>
        )}

        {addressTree.length === 0 ? (
          <p className="rounded-xl bg-[#F8F9FA] px-3 py-4 text-sm text-gray-500 ring-1 ring-black/[0.04]">
            {searchQuery.trim()
              ? t("post.noAddressSearchResults")
              : t("post.emptyAddressSidebar")}
          </p>
        ) : (
          <div className="pr-1">
            {isEnriching && (
              <p className="mb-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700 ring-1 ring-sky-100">
                {t("post.addressTreeLoading")}
              </p>
            )}
            <AddressTreeList
              nodes={addressTree}
              depth={0}
              selectedTreeKey={selectedTreeKey}
              expandedKeys={expandedKeys}
              onToggle={toggleExpanded}
              onSelect={onTreeSelect}
              countLabel={countLabel}
            />
          </div>
        )}
      </section>
    </Card>
  );
}
