import React, { useState, useEffect } from "react";
import api from "../services/api";
import TaskModal from "./TaskModel";
import "../components/PresetsModel.css";

const PresetsModal = ({ show, onClose }) => {
  const [presets, setPresets] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [presetToApply, setPresetToApply] = useState(null);

  const token = localStorage.getItem("token");

  // 🔹 Carregar presets do utilizador autenticado
  const fetchPresets = async () => {
    try {
      const res = await api.get("/presets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPresets(res.data);
    } catch (err) {
      console.error("❌ Erro ao carregar presets:", err);
    }
  };

  // 🔹 Executar apenas quando o modal abre
  useEffect(() => {
    if (show) {
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
    try {
      await api.post("/presets", presetData, {
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

      {/* 🔹 Modal de criação de preset */}
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
