import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../components/TaskModel.css";
import api from "../services/api";
import Select from "react-select";

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
  const [parceiros, setParceiros] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  const [datasDuplicadas, setDatasDuplicadas] = useState([]);
  const [showCalendar, setShowCalendar] = useState(true);


    useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e) => {
      // Evita o comportamento padrão quando o foco não está num textarea
      if (e.key === "Enter" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        // Simula clique no botão de submit
        const form = document.getElementById("form-task");
        if (form) {
          form.requestSubmit(); // executa o onSubmit do form
        }
      }

      // Fecha o modal com Esc
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, handleClose]);
  
  useEffect(() => {
  const handleKeyDown = (e) => {
    // impede o Enter enquanto o alert/confirm está aberto
    if (e.key === "Enter" && document.activeElement.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);


  const token = localStorage.getItem("token");

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

  // 🔹 Carregar listas
  useEffect(() => {
    if (!show) return;
    const fetchData = async () => {
      try {
        const [clientesRes, produtosRes, contratosRes, atividadesRes, parceirosRes] =
          await Promise.all([
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

  // 🔹 Preencher automaticamente ao editar uma tarefa
  useEffect(() => {
    if (editingTask && !isDuplicate) {
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

  // 🔹 Limpar campos quando abrir para Nova Tarefa
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
      setFaturavel("No");
      setViagemFaturavel("No");
      setDatasDuplicadas([]);
    }
  }, [show, editingTask, isPresetMode, presetData, preselectedDate]);

  if (!show) return null;

  // 🔹 Guardar tarefa ou preset
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔹 Caso esteja a criar um PRESET
    if (isPresetMode && !presetData) {
      if (!nomePreset.trim()) {
        alert("O campo 'Nome do Preset' é obrigatório.");
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
        onClose();
      } catch (error) {
        console.error("Task - Erro ao guardar preset:", error);
        alert("Task - Erro ao guardar preset.");
      }
      return; // ✅ encerra aqui, sem continuar com as validações de tarefa
    }

    // 🔹 Caso esteja a CRIAR / EDITAR uma TAREFA normal
    if (!cliente || !produto || !contrato || !atividade || !tempoAtividade || !tempoFaturado || !faturavel) {
      alert("Preenche todos os campos obrigatórios: Cliente, Produto, Contrato, Atividade, Tempo Atividade, Tempo Faturado e Faturável.");
      return;
    }

    // 🔸 Bloqueia submissão se tempos forem "00:00"
    if (tempoAtividade === "00:00" || tempoFaturado === "00:00") {
      alert("O Tempo de Atividade e o Tempo Faturado não podem ser 00:00. Por favor, introduz valores válidos.");
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

    // 🔹 Continua a lógica normal (tarefas ou duplicação)
    try {
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
    const dataISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });

    if (datasDuplicadas.includes(dataISO)) {
      setDatasDuplicadas(datasDuplicadas.filter((d) => d !== dataISO));
    } else {
      setDatasDuplicadas([...datasDuplicadas, dataISO]);
    }
  };

  // 🔹 Opções para Selects
  const clienteOptions = clientes.map((c) => ({ value: c.nome, label: c.nome }));
  const parceiroOptions = parceiros.map((p) => ({ value: p.parceiro, label: p.parceiro }));
  const produtoOptions = produtos.map((p) => ({ value: p.produto, label: p.produto }));
  const contratoOptions = contratosFiltrados.map((c) => ({ value: c.contrato, label: c.contrato }));
  const atividadeOptions = atividades.map((a) => ({ value: a.atividade, label: a.atividade }));

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

  
  const handleClose = async () => {
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
      const confirmExit = await window.confirm(
        "Existem dados preenchidos. Tens a certeza que queres sair sem guardar?"
      );
      if (!confirmExit) return; // ❌ não fecha se escolher "Cancelar"
    }

    onClose(); // ✅ fecha apenas se confirmou
  };





  return (
    <div className="modal-overlay">
      {/* <div className="modal" onClick={(e) => e.stopPropagation()}> */}
      <div className={`modal ${isDuplicate ? "modal-large" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>

        <form id="form-task" onSubmit={handleSubmit} className="form-grid">
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

          {!isDuplicate ? (
              <div className="form-group full-width">
                <label>Data</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required={!isPresetMode}
                />
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

                {/* <div className="selected-dates-list">
                  <h4>Datas selecionadas</h4>
                  {datasDuplicadas.length === 0 ? (
                    <p className="no-dates">Nenhuma data</p>
                  ) : (
                    <ul>
                      {datasDuplicadas.map((d) => (
                        <li key={d}>
                          {new Date(d).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </li>
                      ))}
                    </ul>
                  )}
                </div> */}
              </div>
            )}


          <div className="form-group full-width">
            <label>Descrição</label>
            <textarea
              rows="3"
              placeholder="Descreve a tarefa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required={!isPresetMode}
            />
          </div>

          {/* Select Cliente */}
          <div className="form-group">
            <label>Cliente</label>
            <Select
              options={clienteOptions}
              value={clienteOptions.find((opt) => opt.value === cliente) || null}
              onChange={(selected) => setCliente(selected ? selected.value : "")}
              placeholder="Seleciona um cliente..."
              isClearable
              isSearchable
              required={!isPresetMode}

            />
          </div>

          {/* Select Parceiro */}
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

          {/* Select Produto */}
          <div className="form-group">
            <label>Produto</label>
            <Select
              options={produtoOptions}
              value={produtoOptions.find((opt) => opt.value === produto) || null}
              onChange={(selected) => setProduto(selected ? selected.value : "")}
              placeholder="Seleciona um produto..."
              isClearable
              isSearchable
              required={!isPresetMode}

            />
          </div>

          {/* Select Contrato */}
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
              required={!isPresetMode}

            />
          </div>

          {/* Select Atividade */}
          <div className="form-group">
            <label>Atividade</label>
            <Select
              options={atividadeOptions}
              value={atividadeOptions.find((opt) => opt.value === atividade) || null}
              onChange={(selected) => setAtividade(selected ? selected.value : "")}
              placeholder="Seleciona uma atividade..."
              isClearable
              isSearchable
              required={!isPresetMode}

            />
          </div>

          {/* Tempos */}
          <div className="form-group-time">
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

          

          {/* 🔹 Secção de Local / Faturável / Viagem Faturável + Distância e Valor */}
          <div className="form-group full-width"> 
            {/* 3 linhas de toggles */}
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

            {/* 🔹 Linha separada — Distância e Valor */}
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
