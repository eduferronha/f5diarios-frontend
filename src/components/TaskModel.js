import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../components/TaskModel.css";
import api from "../services/api";

const TaskModal = ({
  show,
  onClose,
  onTaskAdded,
  editingTask,
  isDuplicate,
  isPresetMode = false,
  onPresetSaved,
  presetData,
}) => {
  const [nomePreset, setNomePreset] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cliente, setCliente] = useState("");
  const [parceiro, setParceiro] = useState("");
  const [produto, setProduto] = useState("");
  const [contrato, setContrato] = useState("");
  const [atividade, setAtividade] = useState("");
  const [data, setData] = useState("");
  const [distanciaViagem, setDistanciaViagem] = useState(0);
  const [tempoViagem, setTempoViagem] = useState("00:00");
  const [tempoAtividade, setTempoAtividade] = useState("00:00");
  const [tempoFaturado, setTempoFaturado] = useState("00:00");
  const [valorEuro, setValorEuro] = useState(0);
  const [local, setLocal] = useState("Employee House");
  const [faturavel, setFaturavel] = useState("No");
  const [viagemFaturavel, setViagemFaturavel] = useState("No");

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  const [datasDuplicadas, setDatasDuplicadas] = useState([]);

  const token = localStorage.getItem("token");

  // 🔹 Carregar listas
  useEffect(() => {
    if (!show) return;
    const fetchData = async () => {
      try {
        const [clientesRes, produtosRes, contratosRes, atividadesRes] =
          await Promise.all([
            api.get("/clients", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/products", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/contracts", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/activities", { headers: { Authorization: `Bearer ${token}` } }),
          ]);
        setClientes(clientesRes.data);
        setProdutos(produtosRes.data);
        setContratos(contratosRes.data);
        setAtividades(atividadesRes.data);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      }
    };
    fetchData();
  }, [show]);

  // 🔹 Filtrar contratos pelo cliente
  useEffect(() => {
    if (!cliente) {
      setContratosFiltrados([]);
      return;
    }
    const filtrados = contratos.filter(
      (c) => c.empresa === cliente || c.cliente === cliente
    );
    setContratosFiltrados(filtrados);
  }, [cliente, contratos]);

  // 🔹 Preencher automaticamente ao aplicar preset
  useEffect(() => {
    if (presetData) {
      setDescricao(presetData.descricao || "");
      setCliente(presetData.cliente || "");
      setParceiro(presetData.parceiro || "");
      setProduto(presetData.produto || "");
      setContrato(presetData.contrato || "");
      setAtividade(presetData.atividade || "");
      setDistanciaViagem(presetData.distancia_viagem ?? 0);
      setTempoViagem(presetData.tempo_viagem || "00:00");
      setTempoAtividade(presetData.tempo_atividade || "00:00");
      setTempoFaturado(presetData.tempo_faturado || "00:00");
      setValorEuro(presetData.valor_euro ?? 0);
      setLocal(presetData.local || "Employee House");
      setFaturavel(presetData.faturavel || "No");
      setViagemFaturavel(presetData.viagem_faturavel || "No");
      setData(""); // 👈 Limpa data para nova tarefa
    }
  }, [presetData]);

  if (!show) return null;

  // 🔹 Guardar tarefa ou preset
  const handleSubmit = async (e) => {
    e.preventDefault();

    const baseTaskData = {
      descricao,
      cliente,
      parceiro,
      produto,
      contrato,
      atividade,
      tempo_atividade: tempoAtividade,
      tempo_faturado: tempoFaturado,
      tempo_viagem: tempoViagem,
      distancia_viagem: distanciaViagem,
      valor_euro: valorEuro,
      local,
      faturavel,
      viagem_faturavel: viagemFaturavel,
    };

    try {
      // 🔸 1. Criar Preset Novo
      if (isPresetMode && !presetData) {
        if (!descricao.trim() && !nomePreset.trim()) {
          alert("Indica um nome ou descrição para o preset.");
          return;
        }
        const presetPayload = { ...baseTaskData, nome: nomePreset || descricao };
        await onPresetSaved(presetPayload);
        onClose();
        return;
      }

      // 🔸 2. Aplicar Preset (criar nova tarefa)
      if (presetData) {
        if (!data) {
          alert("Seleciona uma data para a nova tarefa.");
          return;
        }
        await api.post("/tasks", { ...baseTaskData, data }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onTaskAdded && onTaskAdded();
        onClose();
        return;
      }

      // 🔸 3. Criar/Editar Tarefa Normal
      if (!descricao || !cliente || !produto || !contrato || !atividade || !data) {
        alert("Preenche todos os campos obrigatórios.");
        return;
      }

      if (editingTask && !isDuplicate) {
        await api.put(`/tasks/${editingTask.id}`, { ...baseTaskData, data }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (isDuplicate && datasDuplicadas.length > 0) {
        const todasAsDatas = [data, ...datasDuplicadas];
        for (const d of todasAsDatas) {
          await api.post("/tasks", { ...baseTaskData, data: d }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else {
        await api.post("/tasks", { ...baseTaskData, data }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onTaskAdded && onTaskAdded();
      onClose();
    } catch (error) {
      console.error("Erro ao guardar tarefa/preset:", error);
      alert("Erro ao guardar.");
    }
  };

  const toggleData = (date) => {
    const dataISO = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });

    if (datasDuplicadas.includes(dataISO)) {
      setDatasDuplicadas(datasDuplicadas.filter((d) => d !== dataISO));
    } else {
      setDatasDuplicadas([...datasDuplicadas, dataISO]);
    }
  };

  const titulo =
    presetData
      ? "Aplicar Preset"
      : isPresetMode
      ? "Criar Preset"
      : editingTask
      ? isDuplicate
        ? "Duplicar Tarefa"
        : "Editar Tarefa"
      : "Nova Tarefa";

  const textoBotao =
    presetData
      ? "Criar Tarefa"
      : isPresetMode
      ? "Guardar Preset"
      : editingTask
      ? isDuplicate
        ? "Guardar Cópias"
        : "Guardar Alterações"
      : "Guardar";

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{titulo}</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          {isPresetMode && !presetData && (
            <div className="form-group full-width">
              <label>Nome do Preset</label>
              <input
                type="text"
                placeholder="Ex: Cliente X - Instalação"
                value={nomePreset}
                onChange={(e) => setNomePreset(e.target.value)}
                required={isPresetMode}
              />
            </div>
          )}

          <div className="form-group full-width">
            <label>Descrição</label>
            <textarea
              rows="4"
              placeholder="Descreve a tarefa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required={!isPresetMode}
            />
          </div>

          <div className="form-group">
            <label>Cliente</label>
            <input
              list="clientes-list"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Escreve ou seleciona..."
              required={!isPresetMode}
            />
            <datalist id="clientes-list">
              {clientes.map((c) => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>Parceiro</label>
            <input
              type="text"
              value={parceiro}
              onChange={(e) => setParceiro(e.target.value)}
              placeholder="Nome do parceiro..."
            />
          </div>

          <div className="form-group">
            <label>Produto</label>
            <input
              list="produtos-list"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Escreve ou seleciona..."
              required={!isPresetMode}
            />
            <datalist id="produtos-list">
              {produtos.map((p) => (
                <option key={p.id} value={p.produto} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>Contrato</label>
            <input
              list="contratos-list"
              value={contrato}
              onChange={(e) => setContrato(e.target.value)}
              placeholder={cliente ? "Escreve ou seleciona..." : "Escolhe primeiro o cliente"}
              disabled={!cliente}
              required={!isPresetMode}
            />
            <datalist id="contratos-list">
              {contratosFiltrados.map((c) => (
                <option key={c.id} value={c.contrato} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>Atividade</label>
            <input
              list="atividades-list"
              value={atividade}
              onChange={(e) => setAtividade(e.target.value)}
              placeholder="Escreve ou seleciona..."
              required={!isPresetMode}
            />
            <datalist id="atividades-list">
              {atividades.map((a) => (
                <option key={a.id} value={a.atividade} />
              ))}
            </datalist>
          </div>

          <div className="form-group">
            <label>Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required={!isPresetMode}
            />
          </div>

          <div className="form-row">
            <div>
              <label>Tempo Atividade</label>
              <input
                type="time"
                value={tempoAtividade}
                onChange={(e) => setTempoAtividade(e.target.value)}
                required={!isPresetMode}
              />
            </div>
            <div>
              <label>Tempo Faturado</label>
              <input
                type="time"
                value={tempoFaturado}
                onChange={(e) => setTempoFaturado(e.target.value)}
                required={!isPresetMode}
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

          <div className="form-row">
            <div>
              <label>Distância Viagem (km)</label>
              <input
                type="number"
                min="0"
                value={distanciaViagem}
                onChange={(e) => setDistanciaViagem(e.target.value)}
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

          <div className="form-group">
            <label>Local</label>
            <div className="local-toggle-group">
              {["Customer Site", "Office", "Employee House"].map((option) => (
                <label
                  key={option}
                  className={`toggle-option ${local === option ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="local"
                    value={option}
                    checked={local === option}
                    onChange={() => setLocal(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Faturável</label>
            <div className="local-toggle-group">
              {["Yes", "No", "For analysis"].map((option) => (
                <label
                  key={option}
                  className={`toggle-option ${faturavel === option ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="faturavel"
                    value={option}
                    checked={faturavel === option}
                    onChange={() => setFaturavel(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Viagem Faturável</label>
            <div className="local-toggle-group">
              {["Yes", "No", "For analysis"].map((option) => (
                <label
                  key={option}
                  className={`toggle-option ${viagemFaturavel === option ? "active" : ""}`}
                >
                  <input
                    type="radio"
                    name="viagem_faturavel"
                    value={option}
                    checked={viagemFaturavel === option}
                    onChange={() => setViagemFaturavel(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-buttons">
            <button type="submit" className="btn-primary">
              {textoBotao}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
