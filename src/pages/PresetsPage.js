import React, { useState, useEffect } from "react";
import api from "../services/api";
import TaskModal from "./TaskModel";
import "./PresetsModal.css";

const PresetsModal = ({ show, onClose }) => {
  const [presets, setPresets] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [presetToApply, setPresetToApply] = useState(null);
    
  // console.log("SDADSADS")
  // console.log(localStorage.getItem("user"))
  const token = localStorage.getItem("token");

  // 🧩 Obter o username do localStorage.user
  const getUsernameFromStorage = () => {
    try {
      const storedUser = localStorage.getItem("user");
      console.log("📦 Valor bruto em localStorage.user:", storedUser);

      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      console.log("✅ Utilizador parseado:", parsed);
      return parsed?.username || null;
    } catch (error) {
      console.error("❌ Erro ao parsear localStorage.user:", error);
      return null;
    }
  };

  const username = getUsernameFromStorage();
  console.log("🎯 Username final usado:", username);

  // 🔹 Carregar presets do utilizador autenticado
  const fetchPresets = async () => {
    if (!username) {
      console.warn("⚠️ Username é null — fetchPresets não será executado.");
      return;
    }

    try {
      const res = await api.get(`/presets/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`📥 GET /presets/${username}`, res.data);
      setPresets(res.data);
    } catch (err) {
      console.error("❌ Erro ao carregar presets:", err);
    }
  };

  useEffect(() => {
    if (show) {
      console.log("🟢 Modal aberto — a carregar presets...");
      fetchPresets();
    }
  }, [show]);

  // 🔹 Eliminar preset
  const handleDelete = async (id) => {
    if (!window.confirm("Queres mesmo eliminar este preset?")) return;
    try {
      await api.delete(`/presets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPresets();
    } catch (err) {
      console.error("Erro ao eliminar preset:", err);
      alert("Erro ao eliminar preset");
    }
  };

  // 🔹 Aplicar preset (abre o TaskModal)
  const handleApply = (preset) => {
    setPresetToApply(preset);
    setShowTaskModal(true);
  };

  // 🔹 Guardar novo preset
  const handleSavePreset = async (presetData) => {
    if (!username) {
      alert("Erro: utilizador não encontrado.");
      return;
    }

    try {
      const payload = { ...presetData, username };
      console.log("📤 A enviar payload para POST /presets:", payload);

      await api.post("/presets", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchPresets();
      setShowTaskModal(false);
    } catch (err) {
      console.error("Erro ao guardar preset:", err);
      alert("Erro ao guardar preset");
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal presets-modal">
        <h2>Presets</h2>

        <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
          ➕ Criar Novo Preset
        </button>

        <div className="presets-list">
          {presets.length === 0 ? (
            <p>Sem presets guardados.</p>
          ) : (
            presets.map((p) => (
              <div key={p.id} className="preset-card">
                <div>
                  <strong>{p.nome || "Preset sem nome"}</strong>
                  <p>{p.descricao || "Sem descrição"}</p>
                </div>
                <div className="preset-actions">
                  <button onClick={() => handleApply(p)}>Aplicar</button>
                  <button onClick={() => handleDelete(p.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-buttons">
          <button className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          show={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          presetData={presetToApply}
          onPresetSaved={handleSavePreset}
          isPresetMode={true}
        />
      )}
    </div>
  );
};

export default PresetsModal;
