import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../components/TaskModel.css";
import api from "../services/api";
import Select from "react-select";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

const TaskModal = ({
  show,
  onClose,
  onTaskAdded,
  editingTask,
  isDuplicate,
  presetData,
  preselectedDate,
}) => {
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
  const [lastCreatedValues, setLastCreatedValues] = useState(null);

  const [initialValues, setInitialValues] = useState(null);
  const token = localStorage.getItem("token");

  const handleClose = useCallback(async () => {
    if (!initialValues) {
      onClose();
      return;
    }

    const hasChanges =
      descricao !== initialValues.descricao ||
      cliente !== initialValues.cliente ||
      parceiro !== initialValues.parceiro ||
      produto !== initialValues.produto ||
      contrato !== initialValues.contrato ||
      atividade !== initialValues.atividade ||
      data !== initialValues.data ||
      distanciaViagem !== initialValues.distanciaViagem ||
      tempoViagem !== initialValues.tempoViagem ||
      tempoAtividade !== initialValues.tempoAtividade ||
      tempoFaturado !== initialValues.tempoFaturado ||
      valorEuro !== initialValues.valorEuro ||
      local !== initialValues.local ||
      faturavel !== initialValues.faturavel ||
      viagemFaturavel !== initialValues.viagemFaturavel;

    if (hasChanges) {
      const result = await Swal.fire({
        title: "Tens a certeza?",
        text: "Existem dados alterados. Queres sair sem guardar?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#237c9b",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, sair",
        cancelButtonText: "Cancelar",
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
    data,
    distanciaViagem,
    tempoViagem,
    tempoAtividade,
    tempoFaturado,
    valorEuro,
    local,
    faturavel,
    viagemFaturavel,
    initialValues,
    onClose,
  ]);

  useEffect(() => {
    if (show) {
      setInitialValues({
        descricao: editingTask?.descricao || "",
        cliente: editingTask?.cliente || "",
        parceiro: editingTask?.parceiro || "",
        produto: editingTask?.produto || "",
        contrato: editingTask?.contrato || "",
        atividade: editingTask?.atividade || "",
        data: editingTask?.data
          ? editingTask.data.split("T")[0]
          : preselectedDate || "",
        distanciaViagem: editingTask?.distancia_viagem || 0,
        tempoViagem: editingTask?.tempo_viagem || "00:00",
        tempoAtividade: editingTask?.tempo_atividade || "00:00",
        tempoFaturado: editingTask?.tempo_faturado || "00:00",
        valorEuro: editingTask?.valor_euro || 0,
        local: editingTask?.local || "Employee House",
        faturavel: editingTask?.faturavel || "Yes",
        viagemFaturavel: editingTask?.viagem_faturavel || "No",
      });
    }
  }, [show, editingTask, preselectedDate]);

  useEffect(() => {
    if (!show) return;

    const listener = (e) => {
      if (e.key === "Enter" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.getElementById("form-task")?.requestSubmit();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [show, handleClose]);

  useEffect(() => {
    if (preselectedDate) {
      const formatted = new Date(preselectedDate).toISOString().split("T")[0];
      setData(formatted);
    }
  }, [preselectedDate]);

  useEffect(() => {
    if (!show) return;

    const load = async () => {
      try {
        const [c1, c2, c3, c4, c5] = await Promise.all([
          api.get("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/products/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/contracts/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/activities/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/partners/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setClientes(c1.data);
        setProdutos(c2.data);
        setContratos(c3.data);
        setAtividades(c4.data);
        setParceiros(c5.data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar listas.");
      }
    };

    load();
  }, [show, token]);

  useEffect(() => {
    if (!cliente) {
      setContratosFiltrados([]);
      return;
    }

    setContratosFiltrados(
      contratos.filter(
        (c) => c.empresa === cliente || c.cliente === cliente
      )
    );
  }, [cliente, contratos]);

  useEffect(() => {
    if (presetData && !editingTask) {
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
  }, [presetData, editingTask]);

  useEffect(() => {
    if (editingTask) {
      setDescricao(editingTask.descricao || "");
      setCliente(editingTask.cliente || "");
      setParceiro(editingTask.parceiro || "");
      setProduto(editingTask.produto || "");
      setContrato(editingTask.contrato || "");
      setAtividade(editingTask.atividade || "");

      setData(
        editingTask.data ? editingTask.data.split("T")[0] : ""
      );

      setDistanciaViagem(editingTask.distancia_viagem || 0);
      setTempoViagem(editingTask.tempo_viagem || "00:00");
      setTempoAtividade(editingTask.tempo_atividade || "00:00");
      setTempoFaturado(editingTask.tempo_faturado || "00:00");
      setValorEuro(editingTask.valor_euro || 0);
      setLocal(editingTask.local || "Employee House");
      setFaturavel(editingTask.faturavel || "Yes");
      setViagemFaturavel(editingTask.viagem_faturavel || "No");
    }
  }, [editingTask]);

  useEffect(() => {
    if (show && !editingTask && !presetData) {
      setDescricao("");
      setCliente("");
      setParceiro("");
      setProduto("");
      setContrato("");
      setAtividade("");



      setData(
        preselectedDate
          ? new Date(preselectedDate).toISOString().split("T")[0]
          : ""
      );

      setDistanciaViagem(0);
      setTempoViagem("00:00");
      setTempoAtividade("00:00");
      setTempoFaturado("00:00");
      setValorEuro(0);
      setLocal("Employee House");
      setFaturavel("Yes");
      setViagemFaturavel("No");
      // setDatasDuplicadas([]);


    }
  }, [show, editingTask, presetData, preselectedDate]);

  // useEffect(() => {
  //   if (show) {
  //     setIsRepeatMode(false);
  //     setDatasDuplicadas([]);
  //   }
  // }, [show]);


  if (!show) return null;

  const isSameTask = (a, b) => {
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  };


const handleSubmit = async (e, keepOpen = false) => {
  e.preventDefault();

  if (!cliente || !produto || !contrato || !atividade) {
    return Swal.fire({
      icon: "warning",
      title: "Campos obrigatórios",
      text: "Preenche todos os campos obrigatórios.",
      confirmButtonColor: "#237c9b",
    });
  }

  if (!data) {
    return Swal.fire({
      icon: "warning",
      title: "Data em falta",
      text: "Seleciona uma data.",
      confirmButtonColor: "#237c9b",
    });
  }

  const payload = {
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
    data,
  };

  // 🚨 Verificação se está a criar igual à anterior
  if (keepOpen && isSameTask(payload, lastCreatedValues)) {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Tarefa igual à anterior",
      text: "Estás a criar uma tarefa 100% igual à última criada. Tens a certeza?",
      showCancelButton: true,
      confirmButtonColor: "#237c9b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, criar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;
  }

  try {
    await api.post("/tasks", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Tarefa criada!");

    setLastCreatedValues(payload);

    if (!keepOpen) {
      onTaskAdded && onTaskAdded();
      onClose();
    }

  } catch (err) {
    console.error(err);
    toast.error("Erro ao guardar tarefa.");
  }
};


  // const toggleData = (date) => {
  //   const dataISO = new Date(
  //     date.getTime() - date.getTimezoneOffset() * 60000
  //   ).toLocaleDateString("en-CA");

  //   // ❗ IMPEDIR REMOVER A DATA ORIGINAL
  //   if (dataISO === originalRepeatDate) {
  //     return; // faz nada
  //   }

  //   if (datasDuplicadas.includes(dataISO)) {
  //     setDatasDuplicadas(datasDuplicadas.filter((d) => d !== dataISO));
  //   } else {
  //     setDatasDuplicadas([...datasDuplicadas, dataISO]);
  //   }
  // };


  const clienteOptions = clientes.map((c) => ({ value: c.nome, label: c.nome }));
  const parceiroOptions = parceiros.map((p) => ({ value: p.parceiro, label: p.parceiro }));
  const produtoOptions = produtos.map((p) => ({ value: p.produto, label: p.produto }));
  const contratoOptions = contratosFiltrados.map((c) => ({ value: c.contrato, label: c.contrato }));
  const atividadeOptions = atividades.map((a) => ({ value: a.atividade, label: a.atividade }));

  const titulo = editingTask
    ? isDuplicate
      ? "Duplicar Tarefa"
      : "Editar Tarefa"
    : "Nova Tarefa";

  const textoBotao = editingTask
    ? isDuplicate
      ? "Criar Tarefas"
      : "Guardar Alterações"
    : "Criar Tarefa";


  return (
    <div className="modal-overlay">
      <div
        className={`modal ${isDuplicate ? "modal-large" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{titulo}</h2>

        {/* WRAPPER QUE ESCONDE O FORM QUANDO ESTÁ EM MODO REPEAT */}
        <div className="repeat-wrapper">

          <form id="form-task" onSubmit={handleSubmit} className="form-grid">

            {/* FORM NORMAL (DATA) */}
            {!isDuplicate && !isRepeatMode ? (
              <div className="form-group full-width">
                <label>Data</label>
                <div className="data-inline">
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
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
            ) : null}

            {/* FORM NORMAL (RESTO DOS CAMPOS) */}
              <>
                <div className="form-group full-width">
                  <label>Descrição</label>
                  <textarea
                    rows="3"
                    placeholder="Descreve a tarefa..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
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
                    required
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
                    required
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
                    required
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
                    required
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
                      required={faturavel !== "No"}
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
                            className={`toggle-option ${faturavel === option ? "active" : ""}`}>
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
                            className={`toggle-option ${viagemFaturavel === option ? "active" : ""}`}>
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
              </>
          </form>
        </div>



        {/* BOTÕES */}
        <div className="modal-buttons-row">
          <button
            type="submit"
            form="form-task"
            className="btn-primary"
          >
            Criar Tarefa
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={(e) => handleSubmit(e, true)}
          >
            Criar e Continuar
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleClose}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;
