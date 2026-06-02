import { isOperatorUser } from "@/lib/auth/operator";
import type { User } from "@/lib/auth/types";

export const OPERATOR_VIEW_AS_USER_KEY = "tkc_operator_view_as_user";
export const OPERATOR_VIEW_CHANGE_EVENT = "tkc-operator-view-change";

export function readViewAsUser(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(OPERATOR_VIEW_AS_USER_KEY) === "1";
}

export function writeViewAsUser(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(OPERATOR_VIEW_AS_USER_KEY, value ? "1" : "0");
  window.dispatchEvent(new Event(OPERATOR_VIEW_CHANGE_EVENT));
}

/** Operator account with full privileges (not in member preview mode). */
export function hasOperatorPrivileges(user: User | null | undefined): boolean {
  return isOperatorUser(user) && !readViewAsUser();
}
