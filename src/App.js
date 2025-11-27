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
        toastOptions={{
          duration: 4000,
          success: { duration: 2500 },
          error: { duration: 5000 },
        }}
      />

      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

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
