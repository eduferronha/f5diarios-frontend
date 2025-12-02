import React, { useState, useEffect } from "react";
import api from "../services/api";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Select from "react-select";
import "../components/TaskModel.css"; // 👈 Usa o MESMO CSS do TaskModal

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

  const [initialData, setInitialData] = useState(null);


  useEffect(() => {
    if (!show) return;

    const load = async () => {
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
        toast.error("Erro ao carregar listas.");
      }
    };

    load();
  }, [show]);

  useEffect(() => {
    if (!presetData) return;

    const original = {
      nome: presetData.nome || "",
      descricao: presetData.descricao || "",
      cliente: presetData.cliente || "",
      parceiro: presetData.parceiro || "",
      produto: presetData.produto || "",
      contrato: presetData.contrato || "",
      atividade: presetData.atividade || "",
      tempo_atividade: presetData.tempo_atividade || "00:00",
      tempo_faturado: presetData.tempo_faturado || "00:00",
      tempo_viagem: presetData.tempo_viagem || "00:00",
      distancia_viagem: presetData.distancia_viagem || 0,
      valor_euro: presetData.valor_euro || 0,
      local: presetData.local || "Employee House",
      faturavel: presetData.faturavel || "Yes",
      viagem_faturavel: presetData.viagem_faturavel || "No",
    };

    setInitialData(original);

    // preencher os campos como já fazias
    setNome(original.nome);
    setDescricao(original.descricao);
    setCliente(original.cliente);
    setParceiro(original.parceiro);
    setProduto(original.produto);
    setContrato(original.contrato);
    setAtividade(original.atividade);

    setTempoAtividade(original.tempo_atividade);
    setTempoFaturado(original.tempo_faturado);
    setTempoViagem(original.tempo_viagem);

    setDistancia(original.distancia_viagem);
    setValorEuro(original.valor_euro);

    setLocal(original.local);
    setFaturavel(original.faturavel);
    setViagemFaturavel(original.viagem_faturavel);
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

  const hasChanges = () => {
    if (!initialData) return false;

    return (
      initialData.nome !== nome ||
      initialData.descricao !== descricao ||
      initialData.cliente !== cliente ||
      initialData.parceiro !== parceiro ||
      initialData.produto !== produto ||
      initialData.contrato !== contrato ||
      initialData.atividade !== atividade ||
      initialData.tempo_atividade !== tempoAtividade ||
      initialData.tempo_faturado !== tempoFaturado ||
      initialData.tempo_viagem !== tempoViagem ||
      Number(initialData.distancia_viagem) !== Number(distancia) ||
      Number(initialData.valor_euro) !== Number(valorEuro) ||
      initialData.local !== local ||
      initialData.faturavel !== faturavel ||
      initialData.viagem_faturavel !== viagemFaturavel
    );
  };


  return (
    <div className="modal-overlay">
      <div className="modal modal-large">
        <h2>{isEditingPreset ? "Editar Preset" : "Novo Preset"}</h2>

        <form onSubmit={handleSubmit} className="form-grid">

          <div className="form-group full-width">
            <label>Nome do Preset</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Descrição</label>
            <textarea
              rows="3"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Cliente</label>
            <Select
              options={clientes.map((c) => ({ value: c.nome, label: c.nome }))}
              value={cliente ? { value: cliente, label: cliente } : null}
              isClearable
              onChange={(v) => setCliente(v?.value || "")}
            />
          </div>

          <div className="form-group">
            <label>Parceiro</label>
            <Select
              options={parceiros.map((p) => ({
                value: p.parceiro,
                label: p.parceiro,
              }))}
              value={parceiro ? { value: parceiro, label: parceiro } : null}
              isClearable
              onChange={(v) => setParceiro(v?.value || "")}
            />
          </div>

          <div className="form-group">
            <label>Produto</label>
            <Select
              options={produtos.map((p) => ({
                value: p.produto,
                label: p.produto,
              }))}
              value={produto ? { value: produto, label: produto } : null}
              isClearable
              onChange={(v) => setProduto(v?.value || "")}
            />
          </div>

          <div className="form-group">
            <label>Contrato</label>
            <Select
              options={contratosFiltrados.map((c) => ({
                value: c.contrato,
                label: c.contrato,
              }))}
              value={contrato ? { value: contrato, label: contrato } : null}
              isClearable
              onChange={(v) => setContrato(v?.value || "")}
              isDisabled={!cliente}
            />
          </div>

          <div className="form-group">
            <label>Atividade</label>
            <Select
              options={atividades.map((a) => ({
                value: a.atividade,
                label: a.atividade,
              }))}
              value={atividade ? { value: atividade, label: atividade } : null}
              isClearable
              onChange={(v) => setAtividade(v?.value || "")}
            />
          </div>

          {/* Tempos */}
          <div className="form-group-time full-width radio-btn-two">
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

          {/* ToggIes + Distância + Valor */}
          <div className="form-group full-width radio-btn-one">
            <div className="form-row-toggle">

              <div className="form-group">
                <label>Local</label>
                <div className="local-toggle-group">
                  {["Customer Site", "Office", "Employee House"].map((opt) => (
                    <label
                      key={opt}
                      className={`toggle-option ${
                        local === opt ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="local"
                        checked={local === opt}
                        onChange={() => setLocal(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Faturável</label>
                <div className="local-toggle-group">
                  {["Yes", "No", "For analysis"].map((opt) => (
                    <label
                      key={opt}
                      className={`toggle-option ${
                        faturavel === opt ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="faturavel"
                        checked={faturavel === opt}
                        onChange={() => setFaturavel(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Viagem Faturável</label>
                <div className="local-toggle-group">
                  {["Yes", "No", "For analysis"].map((opt) => (
                    <label
                      key={opt}
                      className={`toggle-option ${
                        viagemFaturavel === opt ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="viagem_faturavel"
                        checked={viagemFaturavel === opt}
                        onChange={() => setViagemFaturavel(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Distância e Valor — IDÊNTICO ao TaskModal */}
            <div className="form-distance-value">
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
          </div>
        </form>

        <div className="modal-buttons-row">
          <button className="btn-primary" onClick={handleSubmit}>
            {isEditingPreset ? "Guardar Alterações" : "Criar Preset"}
          </button>

          <button
            className="btn-secondary"
            onClick={() => {
              if (hasChanges()) {
                Swal.fire({
                  title: "Descartar alterações?",
                  text: "Tens alterações por guardar.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#237c9b",
                  cancelButtonColor: "#d33",
                  confirmButtonText: "Sim, sair",
                  cancelButtonText: "Continuar a editar",
                }).then((res) => {
                  if (res.isConfirmed) onClose();
                });
              } else {
                onClose();
              }
            }}
          >
            Cancelar
          </button>

        </div>
      </div>
    </div>
  );
};

export default TaskPresetModal;
