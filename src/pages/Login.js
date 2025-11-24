import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";
import logo from "../F5tci_logo.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post("/auth/login", { username, password });
    localStorage.setItem("token", response.data.access_token);
    localStorage.setItem("user", JSON.stringify(response.data.user)); // <-- adiciona isto
    navigate("/dashboard");
  } catch (err) {
    setError("Credenciais inválidas");
  }
};

const handleMicrosoftLogin = async () => {
  const response = await api.get("/auth/entra/entra-login");
  window.location.href = response.data.auth_url;
};


  return (
    <div className="login-container">
      <div className="login-box">
        <img src={logo} alt="F5TCI Logo" className="login-logo" />

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Utilizador"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Palavra-passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>

          <button type="button" onClick={handleMicrosoftLogin} className="entra-btn">
            <span className="microsoft-icon">
              <svg width="20" height="20" viewBox="0 0 23 23">
                <rect width="10" height="10" x="0" y="0" fill="#F35325" />
                <rect width="10" height="10" x="12" y="0" fill="#81BC06" />
                <rect width="10" height="10" x="0" y="12" fill="#05A6F0" />
                <rect width="10" height="10" x="12" y="12" fill="#FFBA08" />
              </svg>
            </span>
            Entrar com Microsoft
          </button>



          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
