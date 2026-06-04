"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isOperatorUser } from "@/lib/auth/operator";
import {
  OPERATOR_VIEW_CHANGE_EVENT,
  readViewAsUser,
  writeViewAsUser,
} from "@/lib/auth/operatorView";

type OperatorViewContextValue = {
  isOperator: boolean;
  viewAsUser: boolean;
  showOperatorUI: boolean;
  hasOperatorPrivileges: boolean;
  setViewAsUser: (value: boolean) => void;
  toggleViewAsUser: () => void;
  enterOperatorMode: () => void;
  enterMemberPreviewMode: () => void;
};

const OperatorViewContext = createContext<OperatorViewContextValue>({
  isOperator: false,
  viewAsUser: false,
  showOperatorUI: false,
  hasOperatorPrivileges: false,
  setViewAsUser: () => {},
  toggleViewAsUser: () => {},
  enterOperatorMode: () => {},
  enterMemberPreviewMode: () => {},
});

export function OperatorViewProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [viewAsUser, setViewAsUserState] = useState(false);

  useEffect(() => {
    setViewAsUserState(readViewAsUser());
    const sync = () => setViewAsUserState(readViewAsUser());
    window.addEventListener(OPERATOR_VIEW_CHANGE_EVENT, sync);
    return () => window.removeEventListener(OPERATOR_VIEW_CHANGE_EVENT, sync);
  }, [user?.id]);

  const isOperator = isOperatorUser(user);
  const showOperatorUI = isOperator && !viewAsUser;
  const hasPrivileges = showOperatorUI;

  const setViewAsUser = useCallback((value: boolean) => {
    writeViewAsUser(value);
    setViewAsUserState(value);
  }, []);

  const toggleViewAsUser = useCallback(() => {
    setViewAsUser(!viewAsUser);
  }, [setViewAsUser, viewAsUser]);

  const enterOperatorMode = useCallback(() => {
    setViewAsUser(false);
  }, [setViewAsUser]);

  const enterMemberPreviewMode = useCallback(() => {
    setViewAsUser(true);
  }, [setViewAsUser]);

  const value = useMemo(
    () => ({
      isOperator,
      viewAsUser,
      showOperatorUI,
      hasOperatorPrivileges: hasPrivileges,
      setViewAsUser,
      toggleViewAsUser,
      enterOperatorMode,
      enterMemberPreviewMode,
    }),
    [
      isOperator,
      viewAsUser,
      showOperatorUI,
      hasPrivileges,
      setViewAsUser,
      toggleViewAsUser,
      enterOperatorMode,
      enterMemberPreviewMode,
    ]
  );

  return (
    <OperatorViewContext.Provider value={value}>
      {children}
    </OperatorViewContext.Provider>
  );
}

export function useOperatorView() {
  return useContext(OperatorViewContext);
}
