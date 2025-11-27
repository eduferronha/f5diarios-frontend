import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // Se ainda não confirmou o token → mostra nada para evitar flash
  if (token === null) {
    return <Navigate to="/" replace />;
  }

  // Render direto dos filhos (Navbar + página)
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
