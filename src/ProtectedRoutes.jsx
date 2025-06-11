import React from "react";
import useAuthStore from "./store/auth-store";
import { Outlet, Navigate } from "react-router-dom";

function ProtectedRoutes() {
  const { isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default ProtectedRoutes;
