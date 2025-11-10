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
    window.confirm = async function (message) {
    return new Promise((resolve) => {
      const container = document.getElementById("global-alert-container");
      if (!container) return resolve(false);

      const overlay = document.createElement("div");
      overlay.className = "confirm-overlay";

      const box = document.createElement("div");
      box.className = "confirm-box";

      const text = document.createElement("p");
      text.innerText = message;

      const btns = document.createElement("div");
      btns.className = "confirm-buttons";

      const okBtn = document.createElement("button");
      okBtn.className = "confirm-ok";
      okBtn.textContent = "Sim";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "confirm-cancel";
      cancelBtn.textContent = "Cancelar";

      okBtn.onclick = () => {
        overlay.remove();
        resolve(true);
      };
      cancelBtn.onclick = () => {
        overlay.remove();
        resolve(false);
      };

      btns.appendChild(okBtn);
      btns.appendChild(cancelBtn);
      box.appendChild(text);
      box.appendChild(btns);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    });
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
