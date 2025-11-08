import React from "react";
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

function App() {
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

        {/* ✅ Nova página de atividade (apenas Admin) */}
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
      </Routes>

      <Route path="/profile" element={<ProfilePage />} />

    </Router>
  );
}

export default App;
