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
import AuthCallback from "../src/auth/callback/AuthCallback";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        gutter={12}
        // toastOptions={{
        //   duration: 4000,
        // }}
        containerStyle={{
          top: "75px", // distância abaixo do navbar
        }}
      />
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

        <Route path="/auth/callback" element={<AuthCallback />} />

      </Routes>
    </Router>
    </>
  );
}

export default App;
