import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
import "./RelatoriosPage.css";
import TaskModal from "../components/TaskModel";
import { Edit3 } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

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

  const [itemsPorPagina, setItemsPorPagina] = useState(50);
  const dadosVisiveis = dados.slice(0, itemsPorPagina);

  // ✅ Estilo igual ao Atividade
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

  // 🔹 Editar tarefa
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

  // 🔹 Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [tasksRes, usersRes] = await Promise.all([
          api.get("/tasks/all", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/users/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const users = usersRes.data;
        const tarefasComNome = tasksRes.data.map((tarefa) => {
          const user = users.find((u) => u.username === tarefa.username);
          return { ...tarefa, username: user ? user.nome : tarefa.username };
        });

        setUtilizadores(users);
        setDados(tarefasComNome);
        setDadosOriginais(tarefasComNome);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar relatórios.");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [token]);

  // 🔹 Carregar listas auxiliares
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
        toast.error("Erro ao carregar listas auxiliares.");
      }
    };
    carregarListas();
  }, []);

  // 🔹 Filtrar contratos conforme cliente
  useEffect(() => {
    if (cliente === "-Todos-") setContratosFiltrados(contratos);
    else
      setContratosFiltrados(
        contratos.filter((c) => c.cliente_nome === cliente || c.cliente === cliente)
      );
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

  // 🔹 Atualiza automaticamente ao mudar qualquer filtro (como no Atividade)
  useEffect(() => {
    if (dadosOriginais.length === 0) return;

    let filtrados = [...dadosOriginais];

    if (cliente !== "-Todos-") filtrados = filtrados.filter((d) => d.cliente === cliente);
    if (contrato !== "-Todos-") filtrados = filtrados.filter((d) => d.contrato === contrato);
    if (parceiro !== "-Todos-") filtrados = filtrados.filter((d) => d.parceiro === parceiro);
    if (utilizador !== "-Todos-") filtrados = filtrados.filter((d) => d.username === utilizador);

    if (faturar !== "Todos") {
      filtrados = filtrados.filter((d) => {
        const valor = String(d.faturavel || "").toLowerCase();
        if (faturar === "Sim") return valor === "yes" || valor === "for analysis";
        if (faturar === "Não") return valor === "no";
        return true;
      });
    }

    if (faturarDesloc !== "Todos") {
      filtrados = filtrados.filter((d) => {
        const valor = String(d.viagem_faturavel || "").toLowerCase();
        if (faturarDesloc === "Sim") return valor === "yes";
        if (faturarDesloc === "Não") return valor === "no";
        return true;
      });
    }

    const mesesLista = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const inicio = new Date(Number(anoInicio), mesesLista.indexOf(mesInicio.toLowerCase()), 1);
    const fim = new Date(
      Number(anoFim),
      mesesLista.indexOf(mesFim.toLowerCase()) + 1,
      0,
      23,
      59,
      59
    );

    filtrados = filtrados.filter((d) => {
      if (!d.data) return false;
      const partes = d.data.trim().replace(/-/g, "/").split("/");
      if (partes.length !== 3) return false;
      let dia, mes, ano;
      if (partes[0].length === 4) [ano, mes, dia] = partes.map(Number);
      else [dia, mes, ano] = partes.map(Number);
      const dataObj = new Date(ano, mes - 1, dia);
      return dataObj >= inicio && dataObj <= fim;
    });

    setDados(filtrados);
  }, [
    cliente,
    contrato,
    parceiro,
    utilizador,
    faturar,
    faturarDesloc,
    anoInicio,
    mesInicio,
    anoFim,
    mesFim,
  ]);

  // 🔹 Limpar filtros (como no Atividade)
  const limparFiltros = () => {
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
    setDados(dadosOriginais);
    toast("Filtros limpos.", { icon: "🧹", duration: 2000 });
  };

  // 🔹 Exportar Excel (botão no topo)
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

  // Somatórios
  const somarTempos = (tempos) => {
    let totalMinutos = 0;
    tempos.forEach((t) => {
      if (typeof t === "string" && t.includes(":")) {
        const [h, m] = t.split(":").map(Number);
        totalMinutos += h * 60 + m;
      }
    });
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const totalTempoAtividade = somarTempos(linhas.map(l => l["Tempo Atividade"]));
  const totalTempoFaturado = somarTempos(linhas.map(l => l["Tempo Faturado"]));
  const totalValor = linhas.reduce((a, r) => a + (Number(r["Valor (€)"]) || 0), 0);

  // Linha total com cor especial
  linhas.push({
    Data: "",
    Local: "",
    Cliente: "",
    Parceiro: "",
    Produto: "",
    Contrato: "",
    Atividade: "TOTAL GERAL",
    "Tempo Atividade": totalTempoAtividade,
    "Tempo Faturado": totalTempoFaturado,
    Faturável: "",
    "Viagem Faturável": "",
    "Valor (€)": totalValor.toFixed(2),
  });

  const ws = XLSX.utils.json_to_sheet(linhas, { header: colunas });

  // Estilo cabeçalho
  colunas.forEach((col, idx) => {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: idx })];
    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "237C9B" } }, // Azul petróleo da tua app
      alignment: { horizontal: "center" }
    };
  });

  // Estilo linha total
  const totalRowIndex = linhas.length;
  colunas.forEach((col, idx) => {
    const cell = ws[XLSX.utils.encode_cell({ r: totalRowIndex, c: idx })];
    if (!cell) return;

    cell.s = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "C9F7A1" } }, // Verde claro para destacar TOTAL
      alignment: { horizontal: idx === 7 ? "center" : "right" }
    };
  });

  ws["!cols"] = colunas.map(() => ({ wch: 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatórios");
  XLSX.writeFile(wb, "Relatorio_Atividades.xlsx");
};


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

  // Linha TOTAL com cor
  linhas.push([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "TOTAL GERAL",
    "",
    "",
    dados.reduce((acc, d) => acc + (d.tempo_atividade || 0), 0),
    dados.reduce((acc, d) => acc + (d.tempo_faturado || 0), 0),
    dados.reduce((acc, d) => acc + (Number(d.valor_euro) || 0), 0).toFixed(2)
  ]);

  autoTable(doc, {
    head: [colunas],
    body: linhas,
    startY: 60,
    theme: "striped",

    headStyles: {
      fillColor: [35, 124, 155],  // Azul petróleo
      textColor: 255,
      fontStyle: "bold"
    },

    styles: { fontSize: 8, cellPadding: 4 },

    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },

    didParseCell: (data) => {
      // Última linha = TOTAL
      if (data.row.index === linhas.length - 1) {
        data.cell.styles.fillColor = [201, 247, 161]; // Verde claro
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [0, 0, 0];
      }
    }
  });

  doc.save("Relatorio_Atividades.pdf");
};


  return (
    <div className="relatorios-container">
      {/* <Toaster position="top-center" toastOptions={{ duration: 4000 }} /> */}

      {/* === BOTÕES NO TOPO (como tinhas antes) === */}
      <div className="relatorios-actions">
        <button onClick={exportarExcel}>Exportar Excel</button>
        <button onClick={exportarPDF}>Exportar PDF</button>
      </div>

      <div className="relatorios-main">
        {/* === FILTROS (como no Atividade.js) === */}
        <div className="filtros-container-relatorios">
          <h3>Filtros</h3>

          <label>Ano Início</label>
          <Select
            options={anos}
            value={{ value: anoInicio, label: anoInicio }}
            onChange={(opt) => setAnoInicio(opt ? opt.value : "2025")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <label>Mês Início</label>
          <Select
            options={meses}
            value={{ value: mesInicio, label: mesInicio }}
            onChange={(opt) => setMesInicio(opt ? opt.value : "Outubro")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <label>Ano Fim</label>
          <Select
            options={anos}
            value={{ value: anoFim, label: anoFim }}
            onChange={(opt) => setAnoFim(opt ? opt.value : "2025")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <label>Mês Fim</label>
          <Select
            options={meses}
            value={{ value: mesFim, label: mesFim }}
            onChange={(opt) => setMesFim(opt ? opt.value : "Outubro")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <label>Utilizador</label>
          <Select
            options={[
              { value: "-Todos-", label: "-Todos-" },
              ...utilizadores.map((u) => ({ value: u.nome, label: u.nome })),
            ]}
            value={{ value: utilizador, label: utilizador }}
            onChange={(opt) => setUtilizador(opt ? opt.value : "-Todos-")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <label>Cliente</label>
          <Select
            options={[
              { value: "-Todos-", label: "-Todos-" },
              ...clientes.map((c) => ({ value: c.nome, label: c.nome })),
            ]}
            value={{ value: cliente, label: cliente }}
            onChange={(opt) => setCliente(opt ? opt.value : "-Todos-")}
            styles={customSelectStyles}
            isClearable
            isSearchable
            menuPortalTarget={document.body}
          />

          <label>Contrato</label>
          <Select
            options={[
              { value: "-Todos-", label: "-Todos-" },
              ...contratosFiltrados.map((c) => ({ value: c.contrato, label: c.contrato })),
            ]}
            value={{ value: contrato, label: contrato }}
            onChange={(opt) => setContrato(opt ? opt.value : "-Todos-")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <label>Faturar</label>
          <Select
            options={[
              { value: "Todos", label: "Todos" },
              { value: "Sim", label: "Sim" },
              { value: "Não", label: "Não" },
            ]}
            value={{ value: faturar, label: faturar }}
            onChange={(opt) => setFaturar(opt ? opt.value : "Todos")}
            styles={customSelectStyles}
            isClearable
            menuPortalTarget={document.body}
          />

          <div className="filtro-botoes">
            {/* <button onClick={aplicarFiltros}>Filtrar</button> */}
            <button onClick={limparFiltros}>Limpar</button>
          </div>
        </div>

        {/* === TABELA === */}
        <div className="relatorios-table">
          {loading ? (
            <div className="spinner-local">
              <div className="spinner"></div>
              <p>A carregar relatórios...</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Data</th>
                  <th>Utilizador</th>
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
                      <td>{d.username}</td>
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
          )}
        </div>
      </div>

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
            .catch(() => toast.error("Erro ao recarregar tarefas."));
        }}
        editingTask={editingTask}
        isDuplicate={isDuplicate}
      />
    </div>
  );
};

export default RelatoriosPage;
