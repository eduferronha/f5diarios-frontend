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
      const res = await api.get("/presets/", {
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
      await api.post("/presets/", presetData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPresets();
      setShowTaskModal(false);
    } catch (err) {
      console.error("Erro ao guardar preset:", err);
      alert("Erro ao guardar preset");
    }
  };

  // 🔹 Alternar estado ativo / não ativo
  const toggleAtivo = async (preset) => {
    try {
      if (preset.ativo) {
        // desativar
        await api.patch(`/presets/${preset.id}`, { ativo: false }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const ativos = presets.filter((p) => p.ativo);
        if (ativos.length >= 4) {
          alert("Só podes ter no máximo 4 presets ativos.");
          return;
        }
        // ativar
        await api.patch(`/presets/${preset.id}`, { ativo: true }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchPresets();
    } catch (err) {
      console.error("Erro ao atualizar estado do preset:", err);
      alert("Erro ao alterar estado do preset");
    }
  };

  if (!show) return null;

  // 🔹 Separar os presets
  const ativos = presets.filter((p) => p.ativo);
  const naoAtivos = presets.filter((p) => !p.ativo);

  return (
    <div className="modal-overlay">
      <div className="modal presets-modal">
        <h2>Presets</h2>

        <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
          ➕ Criar Novo Preset
        </button>

        {/* --- Presets Ativos --- */}
        <h3 className="section-title">Presets Ativos (máx. 4)</h3>
        <div className="presets-list">
          {ativos.length === 0 ? (
            <p>Sem presets ativos.</p>
          ) : (
            ativos.map((p) => (
              <div key={p.id} className="preset-card ativo">
                <div>
                  <strong>{p.nome || "Preset sem nome"}</strong>
                  <p>{p.descricao || "Sem descrição"}</p>
                </div>
                <div className="preset-actions">
                  <button onClick={() => handleApply(p)}>Aplicar</button>
                  <button onClick={() => toggleAtivo(p)}>Desativar</button>
                  <button onClick={() => handleDelete(p.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- Presets Não Ativos --- */}
        <h3 className="section-title">Presets Não Ativos</h3>
        <div className="presets-list">
          {naoAtivos.length === 0 ? (
            <p>Sem presets não ativos.</p>
          ) : (
            naoAtivos.map((p) => (
              <div key={p.id} className="preset-card">
                <div>
                  <strong>{p.nome || "Preset sem nome"}</strong>
                  <p>{p.descricao || "Sem descrição"}</p>
                </div>
                <div className="preset-actions">
                  <button onClick={() => toggleAtivo(p)}>Ativar</button>
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
