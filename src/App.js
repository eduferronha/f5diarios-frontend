import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RelatoriosPage from "./pages/RelatoriosPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminPage from "./pages/AdminPage";
import Agenda from "./pages/Agenda";
import Atividade from "./pages/Atividade";
import ProjetosPage from "./pages/ProjetosPage";
import ProfilePage from "./pages/ProfilePage";
import "./globalAlerts.css"; // 🔹 importa o CSS dos alerts globais

function App() {
  useEffect(() => {
    // 🔹 cria container global uma única vez
    const containerId = "global-alert-container";
    if (!document.getElementById(containerId)) {
      const container = document.createElement("div");
      container.id = containerId;
      document.body.appendChild(container);
    }

    // 🔹 redefine alert() global
    window.alert = function (message) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const alertDiv = document.createElement("div");
      alertDiv.className = "global-alert";
      alertDiv.innerText = message;
      container.appendChild(alertDiv);

      // remove após 3.5s com animação suave
      setTimeout(() => {
        alertDiv.classList.add("fade-out");
        setTimeout(() => alertDiv.remove(), 500);
      }, 3500);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Página de login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Dashboard />
              </>
            </ProtectedRoute>
          }
        />

        {/* Agenda */}
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Agenda />
              </>
            </ProtectedRoute>
          }
        />

        {/* Página de relatórios */}
        <Route
          path="/analises/relatorios"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <RelatoriosPage />
              </>
            </ProtectedRoute>
          }
        />

        {/* Área de administração */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <>
                <Navbar />
                <AdminPage />
              </>
            </AdminRoute>
          }
        />

        {/* Página de atividade (Admin) */}
        <Route
          path="/atividade"
          element={
            <AdminRoute>
              <>
                <Navbar />
                <Atividade />
              </>
            </AdminRoute>
          }
        />

        {/* Projetos (Admin) */}
        <Route
          path="/projetos"
          element={
            <AdminRoute>
              <>
                <Navbar />
                <ProjetosPage />
              </>
            </AdminRoute>
          }
        />

        {/* Perfil de utilizador */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <ProfilePage />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
