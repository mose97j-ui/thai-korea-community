/** Background tint classes used across operator & user menus. */
export const MENU_TINT_PRESETS = [
  { id: "sky", className: "bg-sky-100" },
  { id: "emerald", className: "bg-emerald-100" },
  { id: "rose", className: "bg-rose-100" },
  { id: "violet", className: "bg-violet-100" },
  { id: "orange", className: "bg-orange-100" },
  { id: "amber", className: "bg-amber-100" },
  { id: "lime", className: "bg-lime-100" },
  { id: "indigo", className: "bg-indigo-100" },
  { id: "red", className: "bg-red-100" },
  { id: "yellow", className: "bg-yellow-100" },
  { id: "purple", className: "bg-purple-100" },
  { id: "slate", className: "bg-slate-100" },
] as const;

export const DEFAULT_MENU_TINT = MENU_TINT_PRESETS[0].className;
