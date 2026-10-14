import React, { createContext, useCallback, useContext, useState } from "react";
import type { SelectBrokerResponse } from "../../../types/brokerContext";

interface PasAuthContextValue {
  preSessionToken: string | null;
  accessToken: string | null;
  activeContext: SelectBrokerResponse["active_context"] | null;
  hasBoundBrokerContext: boolean;
  bindBrokerSession: (session: SelectBrokerResponse) => void;
  clearBrokerContextForSwitch: () => void;
  logout: () => void;
}

const PasAuthContext = createContext<PasAuthContextValue | undefined>(undefined);

export const PasAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preSessionToken, setPreSessionToken] = useState<string | null>(
    () => sessionStorage.getItem("pas_pre_session_jwt") || "dev-pre-session-token",
  );

  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem("pas_access_token"));

  const [activeContext, setActiveContext] = useState<SelectBrokerResponse["active_context"] | null>(() => {
    const raw = sessionStorage.getItem("pas_active_broker_context");
    return raw ? JSON.parse(raw) : null;
  });

  const bindBrokerSession = useCallback((session: SelectBrokerResponse) => {
    sessionStorage.setItem("pas_access_token", session.access_token);
    sessionStorage.setItem("pas_active_broker_context", JSON.stringify(session.active_context));
    setAccessToken(session.access_token);
    setActiveContext(session.active_context);
  }, []);

  const clearBrokerContextForSwitch = useCallback(() => {
    sessionStorage.removeItem("pas_access_token");
    sessionStorage.removeItem("pas_active_broker_context");
    setAccessToken(null);
    setActiveContext(null);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("pas_pre_session_jwt");
    sessionStorage.removeItem("pas_access_token");
    sessionStorage.removeItem("pas_active_broker_context");
    setPreSessionToken(null);
    setAccessToken(null);
    setActiveContext(null);
  }, []);

  const hasBoundBrokerContext = Boolean(
    accessToken && activeContext && (activeContext.broker_id !== null || activeContext.is_global_view),
  );

  return (
    <PasAuthContext.Provider
      value={{
        preSessionToken,
        accessToken,
        activeContext,
        hasBoundBrokerContext,
        bindBrokerSession,
        clearBrokerContextForSwitch,
        logout,
      }}
    >
      {children}
    </PasAuthContext.Provider>
  );
};

export const usePasAuth = (): PasAuthContextValue => {
  const context = useContext(PasAuthContext);
  if (!context) {
    throw new Error("usePasAuth must be used within a PasAuthProvider");
  }
  return context;
};
