"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { reorderIds } from "@/lib/arrayMove";

export type SortableDragHandleProps = {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  "aria-label": string;
};

type SortableTileGridProps<T extends { id: string }> = {
  items: T[];
  enabled?: boolean;
  className?: string;
  dragLabel: string;
  onReorder: (ids: string[]) => void;
  renderItem: (
    item: T,
    meta: {
      dragHandleProps?: SortableDragHandleProps;
      isDragging: boolean;
      isDropTarget: boolean;
    }
  ) => ReactNode;
};

export function SortableDragHandle({
  dragHandleProps,
  className = "",
}: {
  dragHandleProps?: SortableDragHandleProps;
  className?: string;
}) {
  if (!dragHandleProps) {
    return null;
  }

  return (
    <button
      type="button"
      {...dragHandleProps}
      className={`flex h-7 min-w-10 cursor-grab touch-none items-center justify-center rounded-full bg-white/95 px-2 text-sm shadow-sm ring-1 ring-black/[0.08] active:cursor-grabbing ${className}`}
    >
      ⠿
    </button>
  );
}

export default function SortableTileGrid<T extends { id: string }>({
  items,
  enabled = false,
  className,
  dragLabel,
  onReorder,
  renderItem,
}: SortableTileGridProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const itemsRef = useRef(items);
  const onReorderRef = useRef(onReorder);
  const activeIdRef = useRef<string | null>(null);
  const overIdRef = useRef<string | null>(null);

  itemsRef.current = items;
  onReorderRef.current = onReorder;

  const finishDrag = useCallback(() => {
    const currentActiveId = activeIdRef.current;
    const currentOverId = overIdRef.current;
    if (currentActiveId && currentOverId && currentActiveId !== currentOverId) {
      const ids = itemsRef.current.map((item) => item.id);
      onReorderRef.current(reorderIds(ids, currentActiveId, currentOverId));
    }
    activeIdRef.current = null;
    overIdRef.current = null;
    setActiveId(null);
    setOverId(null);
  }, []);

  useEffect(() => {
    if (!activeId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const tile = element?.closest("[data-sortable-id]");
      const id = tile?.getAttribute("data-sortable-id");
      if (id && itemsRef.current.some((item) => item.id === id)) {
        overIdRef.current = id;
        setOverId(id);
      }
    };

    const handlePointerEnd = () => {
      finishDrag();
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerEnd);
    document.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
      document.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [activeId, finishDrag]);

  const handlePointerDown = useCallback(
    (id: string, event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!enabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      activeIdRef.current = id;
      overIdRef.current = id;
      setActiveId(id);
      setOverId(id);
    },
    [enabled]
  );

  return (
    <div className={className}>
      {items.map((item) => {
        const isDragging = activeId === item.id;
        const isDropTarget = Boolean(activeId && overId === item.id && activeId !== item.id);

        return (
          <div
            key={item.id}
            data-sortable-id={item.id}
            className={`relative transition-transform ${
              isDragging ? "z-20 scale-[0.98] opacity-60" : ""
            } ${isDropTarget ? "rounded-2xl ring-2 ring-[#06C755] ring-offset-2" : ""}`}
          >
            {renderItem(item, {
              dragHandleProps: enabled
                ? {
                    onPointerDown: (event) => handlePointerDown(item.id, event),
                    "aria-label": dragLabel,
                  }
                : undefined,
              isDragging,
              isDropTarget,
            })}
          </div>
        );
      })}
    </div>
  );
}
