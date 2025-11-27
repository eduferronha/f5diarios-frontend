import React, { useState, useEffect } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Select from "react-select";
import "../components/TaskPresetModal.css";

const TaskPresetModal = ({
  show,
  onClose,
  presetData,
  onPresetSaved,
  isEditingPreset,
}) => {
  const token = localStorage.getItem("token");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cliente, setCliente] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [produto, setProduto] = useState("");
  const [contrato, setContrato] = useState("");
  const [atividade, setAtividade] = useState("");

  const [tempoAtividade, setTempoAtividade] = useState("00:00");
  const [tempoFaturado, setTempoFaturado] = useState("00:00");
  const [tempoViagem, setTempoViagem] = useState("00:00");

  const [distancia, setDistancia] = useState(0);
  const [valorEuro, setValorEuro] = useState(0);

  const [local, setLocal] = useState("Employee House");
  const [faturavel, setFaturavel] = useState("Yes");
  const [viagemFaturavel, setViagemFaturavel] = useState("No");

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  useEffect(() => {
    if (!show) return;

    const loadData = async () => {
      try {
        const [cli, prod, cont, ativ, parc] = await Promise.all([
          api.get("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/products/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/contracts/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/activities/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/partners/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setClientes(cli.data);
        setProdutos(prod.data);
        setContratos(cont.data);
        setAtividades(ativ.data);
        setParceiros(parc.data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados.");
      }
    };

    loadData();
  }, [show]);

  useEffect(() => {
    if (!presetData) return;

    setNome(presetData.nome || "");
    setDescricao(presetData.descricao || "");
    setCliente(presetData.cliente || "");
    setParceiro(presetData.parceiro || "");
    setProduto(presetData.produto || "");
    setContrato(presetData.contrato || "");
    setAtividade(presetData.atividade || "");

    setTempoAtividade(presetData.tempo_atividade || "00:00");
    setTempoFaturado(presetData.tempo_faturado || "00:00");
    setTempoViagem(presetData.tempo_viagem || "00:00");

    setDistancia(presetData.distancia_viagem || 0);
    setValorEuro(presetData.valor_euro || 0);

    setLocal(presetData.local || "Employee House");
    setFaturavel(presetData.faturavel || "Yes");
    setViagemFaturavel(presetData.viagem_faturavel || "No");
  }, [presetData]);

  useEffect(() => {
    if (!cliente) {
      setContratosFiltrados([]);
      return;
    }

    setContratosFiltrados(
      contratos.filter(
        (c) => c.cliente === cliente || c.empresa === cliente
      )
    );
  }, [cliente, contratos]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nome obrigatório",
        text: "O nome do preset é obrigatório.",
        confirmButtonColor: "#237c9b",
      });
      return;
    }

    const payload = {
      nome: nome.trim(),
      descricao,
      cliente,
      parceiro,
      produto,
      contrato,
      atividade,
      tempo_atividade: tempoAtividade,
      tempo_faturado: tempoFaturado,
      tempo_viagem: tempoViagem,
      distancia_viagem: distancia,
      valor_euro: valorEuro,
      local,
      faturavel,
      viagem_faturavel: viagemFaturavel,
    };

    await onPresetSaved(payload);
  };

  return (
    <div className="preset-overlay">
      <div className="preset-modal">

        <h2>{isEditingPreset ? "Editar Preset" : "Novo Preset"}</h2>

        <form onSubmit={handleSubmit} className="preset-grid">

          {/* Nome */}
          <div className="preset-group preset-full">
            <label>Nome do Preset</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div className="preset-group preset-full">
            <label>Descrição</label>
            <textarea
              rows="3"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Cliente */}
          <div className="preset-group">
            <label>Cliente</label>
            <Select
              options={clientes.map((c) => ({ value: c.nome, label: c.nome }))}
              value={cliente ? { value: cliente, label: cliente } : null}
              isClearable
              onChange={(v) => setCliente(v?.value || "")}
            />
          </div>

          {/* Parceiro */}
          <div className="preset-group">
            <label>Parceiro</label>
            <Select
              options={parceiros.map((p) => ({ value: p.parceiro, label: p.parceiro }))}
              value={parceiro ? { value: parceiro, label: parceiro } : null}
              isClearable
              onChange={(v) => setParceiro(v?.value || "")}
            />
          </div>

          {/* Produto */}
          <div className="preset-group">
            <label>Produto</label>
            <Select
              options={produtos.map((p) => ({ value: p.produto, label: p.produto }))}
              value={produto ? { value: produto, label: produto } : null}
              isClearable
              onChange={(v) => setProduto(v?.value || "")}
            />
          </div>

          {/* Contrato */}
          <div className="preset-group">
            <label>Contrato</label>
            <Select
              options={contratosFiltrados.map((c) => ({ value: c.contrato, label: c.contrato }))}
              value={contrato ? { value: contrato, label: contrato } : null}
              isClearable
              isDisabled={!cliente}
              onChange={(v) => setContrato(v?.value || "")}
            />
          </div>

          {/* Atividade */}
          <div className="preset-group">
            <label>Atividade</label>
            <Select
              options={atividades.map((a) => ({ value: a.atividade, label: a.atividade }))}
              value={atividade ? { value: atividade, label: atividade } : null}
              isClearable
              onChange={(v) => setAtividade(v?.value || "")}
            />
          </div>

          {/* Tempos */}
          <div className="preset-group-time preset-full">
            <div>
              <label>Tempo Atividade</label>
              <input
                type="time"
                value={tempoAtividade}
                onChange={(e) => setTempoAtividade(e.target.value)}
              />
            </div>

            <div>
              <label>Tempo Faturado</label>
              <input
                type="time"
                value={tempoFaturado}
                onChange={(e) => setTempoFaturado(e.target.value)}
              />
            </div>

            <div>
              <label>Tempo Viagem</label>
              <input
                type="time"
                value={tempoViagem}
                onChange={(e) => setTempoViagem(e.target.value)}
              />
            </div>
          </div>

          {/* Radio Groups */}
          <div className="preset-group preset-full preset-radio-row">

            <label>Local</label>
            <div className="preset-toggle-group">
              {["Customer Site", "Office", "Employee House"].map((opt) => (
                <label
                  key={opt}
                  className={local === opt ? "preset-active" : ""}
                >
                  <input
                    type="radio"
                    name="preset_local"
                    value={opt}
                    checked={local === opt}
                    onChange={() => setLocal(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>

            <label>Faturável</label>
            <div className="preset-toggle-group">
              {["Yes", "No", "For analysis"].map((opt) => (
                <label
                  key={opt}
                  className={faturavel === opt ? "preset-active" : ""}
                >
                  <input
                    type="radio"
                    name="preset_faturavel"
                    value={opt}
                    checked={faturavel === opt}
                    onChange={() => setFaturavel(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>

            <label>Viagem Faturável</label>
            <div className="preset-toggle-group">
              {["Yes", "No", "For analysis"].map((opt) => (
                <label
                  key={opt}
                  className={viagemFaturavel === opt ? "preset-active" : ""}
                >
                  <input
                    type="radio"
                    name="preset_viagem"
                    value={opt}
                    checked={viagemFaturavel === opt}
                    onChange={() => setViagemFaturavel(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Distância / Valor */}
          <div className="preset-group preset-full preset-numbers-row">
            <div>
              <label>Distância (km)</label>
              <input
                type="number"
                min="0"
                value={distancia}
                onChange={(e) => setDistancia(e.target.value)}
              />
            </div>

            <div>
              <label>Valor (€)</label>
              <input
                type="number"
                min="0"
                value={valorEuro}
                onChange={(e) => setValorEuro(e.target.value)}
              />
            </div>
          </div>

        </form>

        {/* Botões */}
        <div className="preset-buttons-row">
          <button className="preset-btn-primary" onClick={handleSubmit}>
            {isEditingPreset ? "Guardar Alterações" : "Criar Preset"}
          </button>

          <button className="preset-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

export default TaskPresetModal;
