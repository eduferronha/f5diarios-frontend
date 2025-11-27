import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import TaskPresetModal from "./TaskPresetModal";
import "../components/PresetsModel.css";
import { Trash2, Edit3 } from "lucide-react";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

const PresetsModal = ({ show, onClose }) => {
  const [presets, setPresets] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [presetToApply, setPresetToApply] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const token = localStorage.getItem("token");

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!show || showTaskModal) return;

    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Enter" && !isTyping) {
        e.preventDefault();
        const modalRoot = document.querySelector(".presets-modal");
        const primary = modalRoot?.querySelector(".btn-primary");
        primary?.click();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, showTaskModal, handleClose]);

  const normalizeName = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const fetchPresets = async () => {
    try {
      const res = await api.get("/presets/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPresets(res.data || []);
    } catch (err) {
      console.error("❌ Erro ao carregar presets:", err);
      toast.error("Erro ao carregar presets.");
    }
  };

  const fetchPresetsFresh = async () => {
    const res = await api.get("/presets/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data || [];
  };

  useEffect(() => {
    if (show) fetchPresets();
  }, [show]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Eliminar preset?",
      text: "Esta ação não pode ser revertida.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#237c9b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/presets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPresets();
      toast.success("Preset eliminado com sucesso!");
    } catch (err) {
      console.error("Erro ao eliminar preset:", err);
      toast.error("Erro ao eliminar preset.");
    }
  };

  const handleApply = (preset) => {
    setPresetToApply(preset);
    setEditingPreset(null);
    setShowTaskModal(true);
  };

  const handleEdit = (preset) => {
    setEditingPreset(preset);
    setPresetToApply(null);
    setShowTaskModal(true);
  };

  const handleSavePreset = async (presetData) => {
    try {
      const nomeBruto = presetData?.nome ?? "";
      const nomeNormalizado = normalizeName(nomeBruto);

      if (!nomeNormalizado) {
        await Swal.fire({
          icon: "warning",
          title: "Campo obrigatório",
          text: "O campo 'Nome do Preset' é obrigatório.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }

      const current = await fetchPresetsFresh();
      const existe = current.some(
        (p) =>
          normalizeName(p?.nome) === nomeNormalizado &&
          (!editingPreset || p.id !== editingPreset.id)
      );
      if (existe) {
        await Swal.fire({
          icon: "error",
          title: "Nome duplicado",
          text: "Já existe um preset com esse nome. Escolhe outro nome.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }

      const cleanData = Object.fromEntries(
        Object.entries(presetData).filter(([_, v]) => v !== undefined)
      );
      cleanData.nome = nomeBruto.replace(/\s+/g, " ").trim();

      if (editingPreset) {
        await api.patch(`/presets/${editingPreset.id}`, cleanData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Preset atualizado com sucesso!");
      } else {
        await api.post("/presets/", cleanData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Preset criado com sucesso!");
      }

      await fetchPresets();
      setShowTaskModal(false);
      setEditingPreset(null);
    } catch (err) {
      console.error("Erro ao guardar preset:", err);
      toast.error("Erro ao guardar preset.");
    }
  };

  const toggleAtivo = async (preset) => {
    try {
      if (preset.ativo) {
        await api.patch(
          `/presets/${preset.id}`,
          { ativo: false },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast("Preset desativado.", { icon: "🟡", duration: 2000 });
      } else {
        const ativos = presets.filter((p) => p.ativo);
        if (ativos.length >= 4) {
          await Swal.fire({
            icon: "info",
            title: "Limite atingido",
            text: "Só podes ter no máximo 4 presets ativos.",
            confirmButtonColor: "#237c9b",
          });
          return;
        }
        await api.patch(
          `/presets/${preset.id}`,
          { ativo: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // toast.success("Preset ativado com sucesso!", { duration: 2500 });
      }
      await fetchPresets();
    } catch (err) {
      console.error("Erro ao atualizar estado do preset:", err);
      toast.error("Erro ao alterar estado do preset.");
    }
  };

  if (!show) return null;

  const ativos = presets.filter((p) => p.ativo);
  const naoAtivos = presets.filter((p) => !p.ativo);

  return (
    <div className="modal-overlay">
      {/* <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          success: { duration: 2500 },
          error: { duration: 5000 },
        }}
      /> */}

      <div className="modal presets-modal">
        <h2>Presets</h2>

        <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
          Novo Preset
        </button>

        {/* 🟩 Presets Ativos */}
        <h3 className="section-title">Presets Ativos (máx. 4)</h3>
        <div className="presets-list">
          {ativos.length === 0 ? (
            <p>Sem presets ativos.</p>
          ) : (
            ativos.map((p) => (
              <div key={p.id} className="preset-card ativo">
                <div className="preset-info">
                  <strong>{p.nome || "Preset sem nome"}</strong>
                  <span>{p.descricao || "Sem descrição"}</span>
                </div>
                <div className="preset-actions">
                  <button onClick={() => handleApply(p)}>Aplicar</button>
                  <button onClick={() => toggleAtivo(p)}>Desativar</button>
                  <button
                    className="btn-edit"
                    title="Editar"
                    onClick={() => handleEdit(p)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn-trash"
                    title="Eliminar"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🟥 Presets Não Ativos */}
        <h3 className="section-title">Presets Não Ativos</h3>
        <div className="presets-list">
          {naoAtivos.length === 0 ? (
            <p>Sem presets não ativos.</p>
          ) : (
            naoAtivos.map((p) => (
              <div key={p.id} className="preset-card">
                <div className="preset-info">
                  <strong>{p.nome || "Preset sem nome"}</strong>
                  <span>{p.descricao || "Sem descrição"}</span>
                </div>
                <div className="preset-actions">
                  <button onClick={() => toggleAtivo(p)}>Ativar</button>
                  <button
                    className="btn-edit"
                    title="Editar"
                    onClick={() => handleEdit(p)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn-trash"
                    title="Eliminar"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={16} />
                  </button>
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
        // <TaskModal
        //   show={showTaskModal}
        //   onClose={() => {
        //     setShowTaskModal(false);
        //     setEditingPreset(null);
        //   }}
        //   presetData={editingPreset ? editingPreset : presetToApply}
        //   isPresetMode={true}
        //   isEditingPreset={!!editingPreset}
        //   onPresetSaved={handleSavePreset}
        // />
        <TaskPresetModal
          show={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          presetData={editingPreset ?? presetToApply}
          isEditingPreset={!!editingPreset}
          onPresetSaved={handleSavePreset}
        />

      )}
    </div>
  );
};

export default PresetsModal;
