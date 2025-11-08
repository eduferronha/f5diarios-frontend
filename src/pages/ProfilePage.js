import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./ProfilePage.css";

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUsername(parsedUser.username || parsedUser.name || "");
      setRole(parsedUser.role || "");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As novas passwords não coincidem.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/users/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Password alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("Erro ao alterar password. Verifique a atual ou tente novamente.");
    }
  };

  return (
    <div className="profile-container">
      <h2>Perfil do Utilizador</h2>

      <div className="profile-info">
        <p><strong>Nome de utilizador:</strong> {username}</p>
        <p><strong>Função:</strong> {role}</p>
      </div>

      <hr className="profile-divider" />

      <h3>Alterar Password</h3>
      <form onSubmit={handleSubmit} className="profile-form">
        <label>Password atual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <label>Nova password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <label>Confirmar nova password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit">Guardar alterações</button>

        {message && <p className="success-msg">{message}</p>}
        {error && <p className="error-msg">{error}</p>}
      </form>
    </div>
  );
}
