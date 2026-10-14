import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePasAuth } from "../context/PasAuthContext";

export const RequireBrokerContextGuard: React.FC = () => {
  const { hasBoundBrokerContext } = usePasAuth();
  const location = useLocation();

  if (!hasBoundBrokerContext) {
    // Redirect to /select-broker and preserve the deep-linked URL in `state.from`
    return <Navigate to="/select-broker" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
