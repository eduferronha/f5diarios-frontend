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
import { refreshToken } from "../src/services/authService";
import { Toaster } from "react-hot-toast";

function App() {
    useEffect(() => {
    let inactivityTimer;

    const handleActivity = () => {
      clearTimeout(inactivityTimer);

      // sempre que o user faz algo renova token
      refreshToken();

      //se ficar 1 hora sem atividade faz logout
      inactivityTimer = setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }, 60 * 60 * 1000); // 1h
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);

    handleActivity();

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearTimeout(inactivityTimer);
    };
  }, []);


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
