import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../components/TaskModel.css";
import api from "../services/api";
import Select from "react-select";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

const TaskModal = ({
  show,
  onClose,
  onTaskAdded,
  editingTask,
  isDuplicate,
  isPresetMode = false,
  onPresetSaved,
  presetData,
  preselectedDate,
  isEditingPreset,
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
  const [faturavel, setFaturavel] = useState("Yes");
  const [viagemFaturavel, setViagemFaturavel] = useState("No");

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  const [datasDuplicadas, setDatasDuplicadas] = useState([]);
  const [showCalendar, setShowCalendar] = useState(true);

  const token = localStorage.getItem("token");

  const handleClose = useCallback(async () => {
    const hasChanges =
      descricao ||
      cliente ||
      parceiro ||
      produto ||
      contrato ||
      atividade ||
      tempoAtividade !== "00:00" ||
      tempoFaturado !== "00:00" ||
      distanciaViagem > 0 ||
      valorEuro > 0;

    if (hasChanges) {
      const result = await Swal.fire({
        title: "Tens a certeza?",
        text: "Existem dados preenchidos. Queres sair sem guardar?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#237c9b",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, sair",
        cancelButtonText: "Cancelar",
        backdrop: true,
      });

      if (!result.isConfirmed) return;
    }

    onClose();
  }, [
    descricao,
    cliente,
    parceiro,
    produto,
    contrato,
    atividade,
    tempoAtividade,
    tempoFaturado,
    distanciaViagem,
    valorEuro,
    onClose,
  ]);

  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        const form = document.getElementById("form-task");
        if (form) {
          form.requestSubmit();
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, handleClose]);

  useEffect(() => {
    if (isDuplicate) setShowCalendar(true);
  }, [isDuplicate]);

  useEffect(() => {
    if (preselectedDate) {
      const formattedDate = new Date(preselectedDate)
        .toISOString()
        .split("T")[0];
      setData(formattedDate);
    }
  }, [preselectedDate]);

  useEffect(() => {
    if (!show) return;
    const fetchData = async () => {
      try {
        const [
          clientesRes,
          produtosRes,
          contratosRes,
          atividadesRes,
          parceirosRes,
        ] = await Promise.all([
          api.get("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/products/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/contracts/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/activities/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/partners/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setClientes(clientesRes.data);
        setProdutos(produtosRes.data);
        setContratos(contratosRes.data);
        setAtividades(atividadesRes.data);
        setParceiros(parceirosRes.data);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
        toast.error("Erro ao carregar listas.");
      }
    };
    fetchData();
  }, [show, token]);

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

  useEffect(() => {
    if (isPresetMode && presetData) {
      setDescricao(presetData.descricao || "");
      setCliente(presetData.cliente || "");
      setParceiro(presetData.parceiro || "");
      setProduto(presetData.produto || "");
      setContrato(presetData.contrato || "");
      setAtividade(presetData.atividade || "");
      setDistanciaViagem(presetData.distancia_viagem || 0);
      setTempoViagem(presetData.tempo_viagem || "00:00");
      setTempoAtividade(presetData.tempo_atividade || "00:00");
      setTempoFaturado(presetData.tempo_faturado || "00:00");
    }
  }, [isPresetMode, presetData]);

  useEffect(() => {
    if (editingTask) {
      setDescricao(editingTask.descricao || "");
      setCliente(editingTask.cliente || "");
      setParceiro(editingTask.parceiro || "");
      setProduto(editingTask.produto || "");
      setContrato(editingTask.contrato || "");
      setAtividade(editingTask.atividade || "");
      setData(editingTask.data ? editingTask.data.split("T")[0] : "");
      setDistanciaViagem(editingTask.distancia_viagem || 0);
      setTempoViagem(editingTask.tempo_viagem || "00:00");
      setTempoAtividade(editingTask.tempo_atividade || "00:00");
      setTempoFaturado(editingTask.tempo_faturado || "00:00");
      setValorEuro(editingTask.valor_euro || 0);
      setLocal(editingTask.local || "Employee House");
      setFaturavel(editingTask.faturavel || "No");
      setViagemFaturavel(editingTask.viagem_faturavel || "No");
    }
  }, [editingTask, isDuplicate]);

  useEffect(() => {
    if (show && !editingTask && !isPresetMode && !presetData) {
      setNomePreset("");
      setDescricao("");
      setCliente("");
      setParceiro("");
      setProduto("");
      setContrato("");
      setAtividade("");
      setData(preselectedDate ? new Date(preselectedDate).toISOString().split("T")[0] : "");
      setDistanciaViagem(0);
      setTempoViagem("00:00");
      setTempoAtividade("00:00");
      setTempoFaturado("00:00");
      setValorEuro(0);
      setLocal("Employee House");
      setFaturavel("Yes");
      setViagemFaturavel("No");
      setDatasDuplicadas([]);
    }
  }, [show, editingTask, isPresetMode, presetData, preselectedDate]);

  useEffect(() => {
    if (isEditingPreset && presetData) {
      setNomePreset(presetData.nome || "");
    }
  }, [isEditingPreset, presetData]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🟦 Editar preset existente
    if (isPresetMode && isEditingPreset) {
      const presetPayload = {
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
        nome: nomePreset.trim(),
      };

      try {
        await onPresetSaved(presetPayload);
        onClose();
      } catch (err) {
        console.error(err);
        toast.error("Erro ao guardar preset.");
      }
      return;
    }


// 🟩 Criar novo preset
    if (isPresetMode && !isEditingPreset) {

      if (!nomePreset.trim()) {
        await Swal.fire({
          icon: "warning",
          title: "Campo obrigatório",
          text: "O campo 'Nome do Preset' é obrigatório.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }

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

      const presetPayload = { ...baseTaskData, nome: nomePreset.trim() };
      try {
        await onPresetSaved(presetPayload);
        // toast.success("Preset guardado com sucesso!");
        onClose();
      } catch (error) {
        console.error("Task - Erro ao guardar preset:", error);
        toast.error("Erro ao guardar preset.");
      }
      return;
    }

if (!isPresetMode && !isEditingPreset) {
  if (!cliente || !produto || !contrato || !atividade || !tempoAtividade || !faturavel) {
    await Swal.fire({
      icon: "warning",
      title: "Campos obrigatórios em falta",
      text: "Preenche todos os campos obrigatórios: Cliente, Produto, Contrato, Atividade, Tempo Atividade e Faturável.",
      confirmButtonColor: "#237c9b",
    });
    return;
  }

  // Tempo Faturado só obrigatório se Faturável não for "No"
      if (faturavel !== "No" && (!tempoFaturado || tempoFaturado === "00:00")) {
        await Swal.fire({
          icon: "warning",
          title: "Tempo Faturado inválido",
          text: "O Tempo Faturado é obrigatório porque escolheste uma opção faturável.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }

      // Tempo Atividade continua obrigatório sempre
      if (tempoAtividade === "00:00") {
        await Swal.fire({
          icon: "warning",
          title: "Tempo Atividade inválido",
          text: "O Tempo de Atividade não pode ser 00:00.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }
    }


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
      if (!isPresetMode && presetData && !editingTask) {
        if (!data) {
          await Swal.fire({
            icon: "warning",
            title: "Data em falta",
            text: "Seleciona uma data para a nova tarefa.",
            confirmButtonColor: "#237c9b",
          });
          return;
        }

        await api.post("/tasks", { ...baseTaskData, data }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Tarefa criada com sucesso!");
        onTaskAdded && onTaskAdded();
        onClose();
        return;
      }

      if (!isPresetMode) {
        if (!descricao || !cliente || !produto || !contrato || !atividade) {
          await Swal.fire({
            icon: "warning",
            title: "Campos obrigatórios",
            text: "Preenche todos os campos obrigatórios.",
            confirmButtonColor: "#237c9b",
          });
          return;
        }
      }

      if (isDuplicate && datasDuplicadas.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Nenhuma data selecionada",
          text: "Seleciona pelo menos uma data para duplicar.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }

      if (!isDuplicate && !data && !isPresetMode) {
        await Swal.fire({
          icon: "warning",
          title: "Data em falta",
          text: "Seleciona uma data.",
          confirmButtonColor: "#237c9b",
        });
        return;
      }

      if (editingTask && !isDuplicate) {
        await api.put(`/tasks/${editingTask.id}`, { ...baseTaskData, data }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Tarefa atualizada com sucesso!");
      } else if (isDuplicate && datasDuplicadas.length > 0) {
        const todasAsDatas = [data, ...datasDuplicadas];
        for (const d of todasAsDatas) {
          await api.post("/tasks", { ...baseTaskData, data: d }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        toast.success("Tarefas duplicadas com sucesso!");
      } else {
        await api.post("/tasks", { ...baseTaskData, data }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Tarefa criada com sucesso!");
      }

      onTaskAdded && onTaskAdded();
      onClose();
    } catch (error) {
      console.error("Erro ao guardar tarefa/preset:", error);
      toast.error("Erro ao guardar tarefa/preset.");
    }
  };

  const toggleData = (date) => {
    const dataISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });

    if (datasDuplicadas.includes(dataISO)) {
      setDatasDuplicadas(datasDuplicadas.filter((d) => d !== dataISO));
    } else {
      setDatasDuplicadas([...datasDuplicadas, dataISO]);
    }
  };

  const clienteOptions = clientes.map((c) => ({ value: c.nome, label: c.nome }));
  const parceiroOptions = parceiros.map((p) => ({ value: p.parceiro, label: p.parceiro }));
  const produtoOptions = produtos.map((p) => ({ value: p.produto, label: p.produto }));
  const contratoOptions = contratosFiltrados.map((c) => ({ value: c.contrato, label: c.contrato }));
  const atividadeOptions = atividades.map((a) => ({ value: a.atividade, label: a.atividade }));

const titulo =
  isPresetMode
    ? (isEditingPreset
        ? "Editar Preset"                 // Editar preset existente
        : "Nova Tarefa")                  // Aplicar preset → criar tarefa
    : editingTask
      ? (isDuplicate ? "Duplicar Tarefa" : "Editar Tarefa")
      : "Nova Tarefa";


const textoBotao =
  isPresetMode
    ? (isEditingPreset
        ? "Guardar Alterações"           // editar preset
        : "Criar Tarefa")                // aplicar preset → criar tarefa
    : editingTask
      ? (isDuplicate
          ? "Guardar Cópias"
          : "Guardar Alterações")
      : "Criar Tarefa";


  return (
    <div className="modal-overlay">
      {/* <Toaster position="top-center" reverseOrder={false} /> */}
      <div
        className={`modal ${isDuplicate ? "modal-large" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{titulo}</h2>

        <form id="form-task" onSubmit={handleSubmit} className="form-grid">
          {isPresetMode && (!presetData || isEditingPreset) && (
            <div className="form-group full-width">
              <label>Nome do Preset</label>
              <input
                type="text"
                placeholder="Ex: Cliente X - Instalação"
                value={nomePreset}
                onChange={(e) => setNomePreset(e.target.value)}
                required={true}
              />
            </div>
          )}


          {!isDuplicate ? (
            <div className="form-group full-width">
              <label>Data</label>
              <div className="data-inline">
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required={!isPresetMode && !isEditingPreset}
                />
                <button
                  type="button"
                  className="btn-data"
                  onClick={() => {
                    const hoje = new Date().toISOString().split("T")[0];
                    setData(hoje);
                  }}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  className="btn-data"
                  onClick={() => {
                    const ontem = new Date();
                    ontem.setDate(ontem.getDate() - 1);
                    const dataOntem = ontem.toISOString().split("T")[0];
                    setData(dataOntem);
                  }}
                >
                  Ontem
                </button>
              </div>
            </div>
          ) : (
            <div className="calendar-duplicate-container full-width">
              <div className="calendar-box">
                <Calendar
                  key={datasDuplicadas.join(",")}
                  value={null}
                  onClickDay={toggleData}
                  tileClassName={({ date }) => {
                    const dataISO = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000
                    ).toLocaleDateString("en-CA", {
                      timeZone: "Europe/Lisbon",
                    });
                    return datasDuplicadas.includes(dataISO)
                      ? "selected-day"
                      : null;
                  }}
                />
              </div>
            </div>
          )}

          <div className="form-group full-width">
            <label>Descrição</label>
            <textarea
              rows="3"
              placeholder="Descreve a tarefa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required={!isPresetMode && !isEditingPreset}
            />
          </div>

          <div className="form-group">
            <label>Cliente</label>
            <Select
              options={clienteOptions}
              value={clienteOptions.find((opt) => opt.value === cliente) || null}
              onChange={(selected) => setCliente(selected ? selected.value : "")}
              placeholder="Seleciona um cliente..."
              isClearable
              isSearchable
              required={!isPresetMode && !isEditingPreset}
            />
          </div>

          <div className="form-group">
            <label>Parceiro</label>
            <Select
              options={parceiroOptions}
              value={parceiroOptions.find((opt) => opt.value === parceiro) || null}
              onChange={(selected) => setParceiro(selected ? selected.value : "")}
              placeholder="Seleciona um parceiro..."
              isClearable
              isSearchable
            />
          </div>

          <div className="form-group">
            <label>Produto</label>
            <Select
              options={produtoOptions}
              value={produtoOptions.find((opt) => opt.value === produto) || null}
              onChange={(selected) => setProduto(selected ? selected.value : "")}
              placeholder="Seleciona um produto..."
              isClearable
              isSearchable
              required={!isPresetMode && !isEditingPreset}
            />
          </div>

          <div className="form-group">
            <label>Contrato</label>
            <Select
              options={contratoOptions}
              value={contratoOptions.find((opt) => opt.value === contrato) || null}
              onChange={(selected) => setContrato(selected ? selected.value : "")}
              placeholder={cliente ? "Seleciona um contrato..." : "Escolhe primeiro o cliente"}
              isDisabled={!cliente}
              isClearable
              isSearchable
              required={!isPresetMode && !isEditingPreset}
            />
          </div>

          <div className="form-group">
            <label>Atividade</label>
            <Select
              options={atividadeOptions}
              value={atividadeOptions.find((opt) => opt.value === atividade) || null}
              onChange={(selected) => setAtividade(selected ? selected.value : "")}
              placeholder="Seleciona uma atividade..."
              isClearable
              isSearchable
              required={!isPresetMode && !isEditingPreset}
            />
          </div>

          <div className="form-group-time radio-btn-two">
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
                disabled={faturavel === "No"}
                required={faturavel !== "No" && !isPresetMode && !isEditingPreset}
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

          <div className="form-group full-width radio-btn-one">
            <div className="form-row-toggle">
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
            </div>

            <div className="form-distance-value">
              <div>
                <label>Distância (km)</label>
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
          </div>
        </form>

        <div className="modal-buttons-row">
          <button type="submit" form="form-task" className="btn-primary">
            {textoBotao}
          </button>
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
