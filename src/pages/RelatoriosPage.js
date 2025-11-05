import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Select from "react-select";
import api from "../services/api";
import "./RelatoriosPage.css";
import TaskModal from "../components/TaskModel";
import { Edit3 } from "lucide-react";

const RelatoriosPage = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState([]);
  const [dadosOriginais, setDadosOriginais] = useState([]);

  const [anoInicio, setAnoInicio] = useState({ value: "2025", label: "2025" });
  const [mesInicio, setMesInicio] = useState({ value: "Outubro", label: "Outubro" });
  const [anoFim, setAnoFim] = useState({ value: "2025", label: "2025" });
  const [mesFim, setMesFim] = useState({ value: "Outubro", label: "Outubro" });
  const [faturar, setFaturar] = useState({ value: "--Todos--", label: "--Todos--" });
  const [faturarDesloc, setFaturarDesloc] = useState({ value: "--Todos--", label: "--Todos--" });
  const [cliente, setCliente] = useState({ value: "---Todos---", label: "---Todos---" });
  const [utilizador, setUtilizador] = useState({ value: "---Todos---", label: "---Todos---" });
  const [parceiro, setParceiro] = useState({ value: "---Todos---", label: "---Todos---" });
  const [contrato, setContrato] = useState({ value: "---Todos---", label: "---Todos---" });

  const [clientes, setClientes] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // ✅ Estado para cor do botão Filtrar
  const [filtroAtivo, setFiltroAtivo] = useState(false);

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

  // 🔹 Carregar todas as tarefas
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
    if (cliente.value === "---Todos---") {
      setContratosFiltrados(contratos);
    } else {
      const filtrados = contratos.filter(
        (c) => c.cliente_nome === cliente.value || c.cliente === cliente.value
      );
      setContratosFiltrados(filtrados);
    }
  }, [cliente, contratos]);

  // 🔹 Aplicar filtros
  const aplicarFiltros = () => {
    let filtrados = [...dadosOriginais];

    if (cliente.value !== "---Todos---")
      filtrados = filtrados.filter((d) => d.cliente === cliente.value);

    if (contrato.value !== "---Todos---")
      filtrados = filtrados.filter((d) => d.contrato === contrato.value);

    if (parceiro.value !== "---Todos---")
      filtrados = filtrados.filter((d) => d.parceiro === parceiro.value);

    if (utilizador.value !== "---Todos---")
      filtrados = filtrados.filter((d) => d.username === utilizador.value);

    if (faturar.value !== "--Todos--")
      filtrados = filtrados.filter(
        (d) => String(d.faturavel).toLowerCase() === faturar.value.toLowerCase()
      );

    if (faturarDesloc.value !== "--Todos--")
      filtrados = filtrados.filter(
        (d) =>
          String(d.viagem_faturavel).toLowerCase() ===
          faturarDesloc.value.toLowerCase()
      );

    setDados(filtrados);
    setFiltroAtivo(true);
  };

  // 🔹 Reset cor do botão se alterares algo
  const handleFiltroChange = (setter) => (value) => {
    setter(value);
    setFiltroAtivo(false);
  };

  // 🔹 Limpar filtros
  const limparFiltros = () => {
    setDados(dadosOriginais);
    setCliente({ value: "---Todos---", label: "---Todos---" });
    setContrato({ value: "---Todos---", label: "---Todos---" });
    setUtilizador({ value: "---Todos---", label: "---Todos---" });
    setParceiro({ value: "---Todos---", label: "---Todos---" });
    setFaturar({ value: "--Todos--", label: "--Todos--" });
    setFaturarDesloc({ value: "--Todos--", label: "--Todos--" });
    setFiltroAtivo(false);
  };

  // === Opções dos Selects ===
  const anosOptions = [
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
  ];

  const mesesOptions = [
    { value: "Outubro", label: "Outubro" },
    { value: "Setembro", label: "Setembro" },
    { value: "Agosto", label: "Agosto" },
  ];

  const simNaoOptions = [
    { value: "--Todos--", label: "--Todos--" },
    { value: "Sim", label: "Sim" },
    { value: "Não", label: "Não" },
  ];

  // 🔹 Exportar Excel (mesmo código completo do original)
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
      return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
    };

    const totalTempoAtividade = somarTempos(linhas.map((l) => l["Tempo Atividade"]));
    const totalTempoFaturado = somarTempos(linhas.map((l) => l["Tempo Faturado"]));
    const totalValor = linhas.reduce(
      (acc, row) => acc + (Number(row["Valor (€)"]) || 0),
      0
    );

    linhas.push({
      Data: "",
      Utilizador: "",
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

    // 🔹 Exportar PDF (completo)
  const exportarPDF = () => {
    try {
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

      if (linhas.length === 0) {
        alert("Não há dados para exportar.");
        return;
      }

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
        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
      };

      const totalTempoAtividade = somarTempos(dados.map((d) => d.tempo_atividade));
      const totalTempoFaturado = somarTempos(dados.map((d) => d.tempo_faturado));
      const totalValor = dados.reduce(
        (acc, d) => acc + (Number(d.valor_euro) || 0),
        0
      );

      const totalRow = [
        "", "", "", "", "", "", "", "", "TOTAL", "",
        totalTempoAtividade, totalTempoFaturado, totalValor.toFixed(2),
      ];

      linhas.push(totalRow);

      autoTable(doc, {
        head: [colunas],
        body: linhas,
        startY: 60,
        theme: "striped",
        styles: {
          fontSize: 8,
          cellPadding: 4,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [0, 120, 215],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        didDrawCell: (data) => {
          const isTotalRow = data.row.index === linhas.length - 1;
          if (isTotalRow) {
            data.cell.styles.fillColor = [232, 234, 246];
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      doc.save("Relatorio_Atividades.pdf");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao gerar o PDF. Verifica a consola para detalhes.");
    }
  };

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <div className="relatorios-actions">
          <button onClick={exportarExcel}>Exportar para Excel</button>
          <button onClick={exportarPDF}>Exportar para PDF</button>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>A carregar relatórios...</p>
        </div>
      ) : (
        <div className="relatorios-main">
          {/* === FILTROS === */}
          <div className="filtros-container-relatorios">
            <h3>Pesquisar</h3>

            <label>Ano Início</label>
            <Select
              options={[
                { value: "2025", label: "2025" },
                { value: "2024", label: "2024" },
              ]}
              value={anoInicio}
              onChange={handleFiltroChange(setAnoInicio)}
              className="select-relatorios"
            />

            <label>Mês Início</label>
            <Select
              options={[
                { value: "Outubro", label: "Outubro" },
                { value: "Setembro", label: "Setembro" },
                { value: "Agosto", label: "Agosto" },
              ]}
              value={mesInicio}
              onChange={handleFiltroChange(setMesInicio)}
              className="select-relatorios"
            />

            <label>Ano Fim</label>
            <Select
              options={[
                { value: "2025", label: "2025" },
                { value: "2024", label: "2024" },
              ]}
              value={anoFim}
              onChange={handleFiltroChange(setAnoFim)}
              className="select-relatorios"
            />

            <label>Mês Fim</label>
            <Select
              options={[
                { value: "Outubro", label: "Outubro" },
                { value: "Setembro", label: "Setembro" },
                { value: "Agosto", label: "Agosto" },
              ]}
              value={mesFim}
              onChange={handleFiltroChange(setMesFim)}
              className="select-relatorios"
            />

            <label>Faturar</label>
            <Select
              options={[
                { value: "--Todos--", label: "--Todos--" },
                { value: "Sim", label: "Sim" },
                { value: "Não", label: "Não" },
              ]}
              value={faturar}
              onChange={handleFiltroChange(setFaturar)}
              className="select-relatorios"
            />

            <label>Faturar Deslocações</label>
            <Select
              options={[
                { value: "--Todos--", label: "--Todos--" },
                { value: "Sim", label: "Sim" },
                { value: "Não", label: "Não" },
              ]}
              value={faturarDesloc}
              onChange={handleFiltroChange(setFaturarDesloc)}
              className="select-relatorios"
            />

            <label>Utilizador</label>
            <Select
              options={[
                { value: "---Todos---", label: "---Todos---" },
                ...utilizadores.map((u) => ({ value: u.nome, label: u.nome })),
              ]}
              value={utilizador}
              onChange={handleFiltroChange(setUtilizador)}
              className="select-relatorios"
              isSearchable
            />

            <label>Cliente</label>
            <Select
              options={[
                { value: "---Todos---", label: "---Todos---" },
                ...clientes.map((c) => ({ value: c.nome, label: c.nome })),
              ]}
              value={cliente}
              onChange={handleFiltroChange(setCliente)}
              className="select-relatorios"
              isSearchable
            />

            <label>Contrato</label>
            <Select
              options={[
                { value: "---Todos---", label: "---Todos---" },
                ...contratosFiltrados.map((c) => ({
                  value: c.contrato,
                  label: c.contrato,
                })),
              ]}
              value={contrato}
              onChange={handleFiltroChange(setContrato)}
              className="select-relatorios"
              isSearchable
            />

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

          {/* === TABELA === */}
          <div className="relatorios-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}></th>
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
                {dados.map((d, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === MODAL === */}
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
