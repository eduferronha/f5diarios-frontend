import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
import "./RelatoriosPage.css";
import TaskModal from "../components/TaskModel";
import { Edit3 } from "lucide-react";
import Select from "react-select";

const RelatoriosPage = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState([]);
  const [dadosOriginais, setDadosOriginais] = useState([]);

  const [anoInicio, setAnoInicio] = useState("2025");
  const [mesInicio, setMesInicio] = useState("Outubro");
  const [anoFim, setAnoFim] = useState("2025");
  const [mesFim, setMesFim] = useState("Outubro");
  const [faturar, setFaturar] = useState("Todos");
  const [faturarDesloc, setFaturarDesloc] = useState("Todos");
  const [cliente, setCliente] = useState("-Todos-");
  const [utilizador, setUtilizador] = useState("-Todos-");
  const [parceiro, setParceiro] = useState("-Todos-");
  const [contrato, setContrato] = useState("-Todos-");

  const [clientes, setClientes] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState(false);

  const [itemsPorPagina, setItemsPorPagina] = useState(50);
  const dadosVisiveis = dados.slice(0, itemsPorPagina);


  // ✅ Estilo igual ao TaskModal
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "#fafafa",
      border: state.isFocused ? "1px solid #237c9b" : "1px solid #ccc",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(35,124,155,0.2)" : "none",
      borderRadius: 6,
      minHeight: 32,
      fontSize: "0.75rem",
      transition: "all 0.2s ease",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#237c9b"
        : state.isFocused
        ? "#e3f2fd"
        : "white",
      color: state.isSelected ? "white" : "#333",
      fontSize: "0.75rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#333",
      fontWeight: 500,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsDuplicate(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setShowModal(false);
    setIsDuplicate(false);
  };

  // 🔹 Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const response = await api.get("/tasks/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDados(response.data);
        setDadosOriginais(response.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, [token]);

  // 🔹 Carregar listas
  useEffect(() => {
    const carregarListas = async () => {
      try {
        const [clientesRes, contratosRes, parceirosRes, utilizadoresRes] =
          await Promise.all([
            api.get("/clients/", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/contracts/", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/partners/", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/users/", { headers: { Authorization: `Bearer ${token}` } }),
          ]);

        setClientes(clientesRes.data);
        setContratos(contratosRes.data);
        setParceiros(parceirosRes.data);
        setUtilizadores(utilizadoresRes.data);
      } catch (error) {
        console.error("Erro ao carregar listas:", error);
      }
    };
    carregarListas();
  }, []);

  // 🔹 Filtrar contratos conforme cliente
  useEffect(() => {
    if (cliente === "-Todos-") {
      setContratosFiltrados(contratos);
    } else {
      const filtrados = contratos.filter(
        (c) => c.cliente_nome === cliente || c.cliente === cliente
      );
      setContratosFiltrados(filtrados);
    }
  }, [cliente, contratos]);

  // 🔹 Opções de meses e anos
  const anos = ["2023", "2024", "2025", "2026", "2027"].map((a) => ({
    value: a,
    label: a,
  }));
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ].map((m) => ({ value: m, label: m }));

  // 🔹 Aplicar filtros
  const aplicarFiltros = () => {
    let filtrados = [...dadosOriginais];

    // Filtros principais
    // 🔹 Filtros principais
if (cliente !== "-Todos-")
  filtrados = filtrados.filter((d) => d.cliente === cliente);
if (contrato !== "-Todos-")
  filtrados = filtrados.filter((d) => d.contrato === contrato);
if (parceiro !== "-Todos-")
  filtrados = filtrados.filter((d) => d.parceiro === parceiro);
if (utilizador !== "-Todos-")
  filtrados = filtrados.filter((d) => d.username === utilizador);

// 🔹 Filtro "Faturar"
if (faturar !== "Todos") {
  filtrados = filtrados.filter((d) => {
    const valor = String(d.faturavel || "").toLowerCase();
    if (faturar === "Sim") return valor === "yes" || valor === "for analysis";
    if (faturar === "Não") return valor === "no";
    return true;
  });
}

// 🔹 Filtro "Faturar Deslocações"
if (faturarDesloc !== "Todos") {
  filtrados = filtrados.filter((d) => {
    const valor = String(d.viagem_faturavel || "").toLowerCase();
    if (faturarDesloc === "Sim") return valor === "yes";
    if (faturarDesloc === "Não") return valor === "no";
    return true;
  });
}

    // 🔹 Filtro por intervalo de datas (ano/mês)
    // 🔹 Filtro por intervalo de datas (ano/mês)
      // 🔹 Filtro por intervalo de datas (ano/mês)
const mesesLista = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

const inicio = new Date(
  Number(anoInicio),
  mesesLista.indexOf(mesInicio.toLowerCase()),
  1
);
const fim = new Date(
  Number(anoFim),
  mesesLista.indexOf(mesFim.toLowerCase()) + 1,
  0,
  23, 59, 59 // último dia, até o fim do dia
);

filtrados = filtrados.filter((d) => {
  if (!d.data) return false;

  // Remove espaços e aceita tanto "/" como "-"
  const partes = d.data.trim().replace(/-/g, "/").split("/");
  if (partes.length !== 3) return false;

  // Lida com formatos "dd/mm/yyyy" e "yyyy/mm/dd"
  let dia, mes, ano;
  if (partes[0].length === 4) {
    // formato "yyyy/mm/dd"
    [ano, mes, dia] = partes.map(Number);
  } else {
    // formato "dd/mm/yyyy"
    [dia, mes, ano] = partes.map(Number);
  }

  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return false;

  const dataObj = new Date(ano, mes - 1, dia);
  if (isNaN(dataObj)) return false; // ainda não é data válida

  return dataObj >= inicio && dataObj <= fim;
});



    setDados(filtrados);
    setFiltroAtivo(true);
  };

  const handleFiltroChange = (setter) => (selected) => {
    setter(selected ? selected.value : "");
    setFiltroAtivo(false);
  };

  const limparFiltros = () => {
    setDados(dadosOriginais);
    setCliente("-Todos-");
    setContrato("-Todos-");
    setUtilizador("-Todos-");
    setParceiro("-Todos-");
    setFaturar("Todos");
    setFaturarDesloc("Todos");
    setAnoInicio("2025");
    setMesInicio("Outubro");
    setAnoFim("2025");
    setMesFim("Outubro");
    setFiltroAtivo(false);
  };

  // 🔹 Exportar Excel
  const exportarExcel = () => {
    const colunas = [
      "Data",
      "Utilizador",
      "Local",
      "Cliente",
      "Parceiro",
      "Produto",
      "Contrato",
      "Atividade",
      "Tempo Atividade",
      "Tempo Faturado",
      "Faturável",
      "Viagem Faturável",
      "Valor (€)",
    ];

    const linhas = dados.map((d) => ({
      Data: d.data || "",
      Utilizador: d.username || "",
      Local: d.local || "",
      Cliente: d.cliente || "",
      Parceiro: d.parceiro || "",
      Produto: d.produto || "",
      Contrato: d.contrato || "",
      Atividade: d.atividade || "",
      "Tempo Atividade": d.tempo_atividade || "00:00",
      "Tempo Faturado": d.tempo_faturado || "00:00",
      Faturável: d.faturavel || "",
      "Viagem Faturável": d.viagem_faturavel || "",
      "Valor (€)": Number(d.valor_euro) || 0,
    }));

    const somarTempos = (tempos) => {
      let totalMinutos = 0;
      tempos.forEach((t) => {
        if (typeof t === "string" && t.includes(":")) {
          const [h, m] = t.split(":").map(Number);
          totalMinutos += h * 60 + m;
        }
      });
      const horas = Math.floor(totalMinutos / 60);
      const minutos = totalMinutos % 60;
      return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
        2,
        "0"
      )}`;
    };

    const totalTempoAtividade = somarTempos(linhas.map((l) => l["Tempo Atividade"]));
    const totalTempoFaturado = somarTempos(linhas.map((l) => l["Tempo Faturado"]));
    const totalValor = linhas.reduce(
      (acc, row) => acc + (Number(row["Valor (€)"]) || 0),
      0
    );

    linhas.push({
      Data: "",
      Local: "",
      Cliente: "",
      Parceiro: "",
      Produto: "",
      Contrato: "",
      Atividade: "Total",
      "Tempo Atividade": totalTempoAtividade,
      "Tempo Faturado": totalTempoFaturado,
      Faturável: "",
      "Viagem Faturável": "",
      "Valor (€)": totalValor.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(linhas, { header: colunas });
    ws["!cols"] = colunas.map(() => ({ wch: 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatórios");
    XLSX.writeFile(wb, "Relatorio_Atividades.xlsx");
  };

  // 🔹 Exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("Relatório de Atividades", 40, 40);

    const colunas = [
      "Data",
      "Utilizador",
      "Local",
      "Cliente",
      "Parceiro",
      "Produto",
      "Contrato",
      "Atividade",
      "Faturável",
      "Viagem Faturável",
      "Tempo Atividade",
      "Tempo Faturado",
      "Valor (€)",
    ];

    const linhas = dados.map((d) => [
      d.data || "",
      d.username || "",
      d.local || "",
      d.cliente || "",
      d.parceiro || "",
      d.produto || "",
      d.contrato || "",
      d.atividade || "",
      d.faturavel || "",
      d.viagem_faturavel || "",
      d.tempo_atividade || "00:00",
      d.tempo_faturado || "00:00",
      d.valor_euro ? Number(d.valor_euro).toFixed(2) : "0.00",
    ]);

    autoTable(doc, {
      head: [colunas],
      body: linhas,
      startY: 60,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [0, 120, 215], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save("Relatorio_Atividades.pdf");
  };

  return (
    <div className="relatorios-container">
      <div className="relatorios-actions">
      <button onClick={exportarExcel}>Exportar para Excel</button>
      <button onClick={exportarPDF}>Exportar para PDF</button>

      <div className="items-control">
        <label>Mostrar</label>
        <input
          type="number"
          min="1"
          value={itemsPorPagina}
          onChange={(e) => setItemsPorPagina(Number(e.target.value))}
        />
        <span>itens</span>
        <button onClick={() => setItemsPorPagina(dados.length)}>Ver Todos</button>
      </div>
    </div>


      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>A carregar relatórios...</p>
        </div>
      ) : (
        <div className="relatorios-main">
          <div className="filtros-container-relatorios">
            <h3>Pesquisar</h3>

            <label>Ano Início</label>
            <Select
              options={anos}
              value={{ value: anoInicio, label: anoInicio }}
              onChange={handleFiltroChange(setAnoInicio)}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />

            <label>Mês Início</label>
            <Select
              options={meses}
              value={{ value: mesInicio, label: mesInicio }}
              onChange={handleFiltroChange(setMesInicio)}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />

            <label>Ano Fim</label>
            <Select
              options={anos}
              value={{ value: anoFim, label: anoFim }}
              onChange={handleFiltroChange(setAnoFim)}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />

            <label>Mês Fim</label>
            <Select
              options={meses}
              value={{ value: mesFim, label: mesFim }}
              onChange={handleFiltroChange(setMesFim)}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />

            <label>Utilizador</label>
            <Select
              options={[
                { value: "-Todos-", label: "-Todos-" },
                ...utilizadores.map((u) => ({ value: u.nome, label: u.nome })),
              ]}
              value={{ value: utilizador, label: utilizador }}
              onChange={handleFiltroChange(setUtilizador)}
              styles={customSelectStyles}
              isSearchable
              menuPortalTarget={document.body}
            />

            <label>Cliente</label>
            <Select
              options={[
                { value: "-Todos-", label: "-Todos-" },
                ...clientes.map((c) => ({ value: c.nome, label: c.nome })),
              ]}
              value={{ value: cliente, label: cliente }}
              onChange={handleFiltroChange(setCliente)}
              styles={customSelectStyles}
              isSearchable
              menuPortalTarget={document.body}
            />

            <label>Contrato</label>
            <Select
              options={[
                { value: "-Todos-", label: "-Todos-" },
                ...contratosFiltrados.map((c) => ({
                  value: c.contrato,
                  label: c.contrato,
                })),
              ]}
              value={{ value: contrato, label: contrato }}
              onChange={handleFiltroChange(setContrato)}
              styles={customSelectStyles}
              isSearchable
              menuPortalTarget={document.body}
            />

            {/* <label>Parceiro</label>
            <Select
              options={[
                { value: "-Todos-", label: "-Todos-" },
                ...parceiros.map((p) => ({ value: p.nome, label: p.nome })),
              ]}
              value={{ value: parceiro, label: parceiro }}
              onChange={handleFiltroChange(setParceiro)}
              styles={customSelectStyles}
              isSearchable
              menuPortalTarget={document.body}
            /> */}

            <label>Faturar</label>
            <Select
              options={[
                { value: "Todos", label: "Todos" },
                { value: "Sim", label: "Sim" },
                { value: "Não", label: "Não" },
              ]}
              value={{ value: faturar, label: faturar }}
              onChange={handleFiltroChange(setFaturar)}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            />

            {/* <label>Faturar Deslocações</label>
            <Select
              options={[
                { value: "Todos", label: "Todos" },
                { value: "Sim", label: "Sim" },
                { value: "Não", label: "Não" },
              ]}
              value={{ value: faturarDesloc, label: faturarDesloc }}
              onChange={handleFiltroChange(setFaturarDesloc)}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
            /> */}

            <div className="filtro-botoes-relatorios">
              <button
                onClick={aplicarFiltros}
                className={filtroAtivo ? "filtro-ativo" : ""}
              >
                Filtrar
              </button>
              <button onClick={limparFiltros}>Limpar</button>
            </div>
          </div>

          <div className="relatorios-table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Data</th>
                  <th>Local</th>
                  <th>Cliente</th>
                  <th>Parceiro</th>
                  <th>Produto</th>
                  <th>Contrato</th>
                  <th>Atividade</th>
                  <th>Tempo Atividade</th>
                  <th>Tempo Faturado</th>
                  <th>Faturável</th>
                  <th>Viagem Faturável</th>
                  <th>Valor (€)</th>
                </tr>
              </thead>
              <tbody>
                {dados.length === 0 ? (
                  <tr>
                    <td colSpan="13" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                      Nenhum resultado encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  dadosVisiveis.map((d, i) => (
                    <tr key={i}>
                      <td className="cell-edit">
                        <button
                          className="btn-icon"
                          title="Editar tarefa"
                          onClick={() => handleEdit(d)}
                        >
                          <Edit3 size={16} color="#237c9b" />
                        </button>
                      </td>
                      <td>{d.data}</td>
                      <td>{d.local}</td>
                      <td>{d.cliente}</td>
                      <td>{d.parceiro}</td>
                      <td>{d.produto}</td>
                      <td>{d.contrato}</td>
                      <td>{d.atividade}</td>
                      <td>{d.tempo_atividade}</td>
                      <td>{d.tempo_faturado}</td>
                      <td>{d.faturavel}</td>
                      <td>{d.viagem_faturavel}</td>
                      <td>{d.valor_euro}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TaskModal
        show={showModal}
        onClose={handleCloseModal}
        onTaskAdded={() => {
          setShowModal(false);
          setEditingTask(null);
          setIsDuplicate(false);
          api
            .get("/tasks/all", { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => setDados(res.data))
            .catch((err) => console.error("Erro ao recarregar tarefas:", err));
        }}
        editingTask={editingTask}
        isDuplicate={isDuplicate}
      />
    </div>
  );
};

export default RelatoriosPage;
