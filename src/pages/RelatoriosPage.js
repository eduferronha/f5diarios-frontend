import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
import "./RelatoriosPage.css";

const RelatoriosPage = () => {
  const token = localStorage.getItem("token");

  const [dados, setDados] = useState([]);
  const [dadosOriginais, setDadosOriginais] = useState([]);

  const [anoInicio, setAnoInicio] = useState("2025");
  const [mesInicio, setMesInicio] = useState("Outubro");
  const [anoFim, setAnoFim] = useState("2025");
  const [mesFim, setMesFim] = useState("Outubro");
  const [faturar, setFaturar] = useState("--Todos--");
  const [faturarDesloc, setFaturarDesloc] = useState("--Todos--");
  const [cliente, setCliente] = useState("---Todos---");
  const [utilizador, setUtilizador] = useState("---Todos---");
  const [parceiro, setParceiro] = useState("---Todos---");
  const [contrato, setContrato] = useState("---Todos---");

  const [clientes, setClientes] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  // 🟦 Carregar tarefas
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await api.get("/tasks");
        setDados(response.data);
        setDadosOriginais(response.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    carregarDados();
  }, []);

  // 🟦 Carregar listas (clientes, contratos, parceiros, utilizadores)
  useEffect(() => {
    const carregarListas = async () => {
      try {
        const [clientesRes, contratosRes, parceirosRes, utilizadoresRes] =
          await Promise.all([
            api.get("/clients", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/contracts", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/partners", { headers: { Authorization: `Bearer ${token}` } }),
            api.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
          ]);

        setClientes(clientesRes.data);
        setContratos(contratosRes.data);
        setParceiros(parceirosRes.data);
        setUtilizadores(utilizadoresRes.data);
      } catch (error) {
        console.error("Erro ao carregar listas de filtros:", error);
      }
    };

    carregarListas();
  }, []);

  // 🟦 Filtrar contratos conforme cliente
  useEffect(() => {
    if (cliente === "---Todos---") {
      setContratosFiltrados(contratos);
    } else {
      const filtrados = contratos.filter(
        (c) => c.cliente_nome === cliente || c.cliente === cliente
      );
      setContratosFiltrados(filtrados);
    }
  }, [cliente, contratos]);

  // 🟦 Aplicar filtros
  const aplicarFiltros = () => {
    let filtrados = [...dadosOriginais];

    if (cliente !== "---Todos---") {
      filtrados = filtrados.filter((d) => d.cliente === cliente);
    }

    if (contrato !== "---Todos---") {
      filtrados = filtrados.filter((d) => d.contrato === contrato);
    }

    if (parceiro !== "---Todos---") {
      filtrados = filtrados.filter((d) => d.parceiro === parceiro);
    }

    if (utilizador !== "---Todos---") {
      filtrados = filtrados.filter((d) => d.utilizador === utilizador);
    }

    if (faturar !== "--Todos--") {
      filtrados = filtrados.filter(
        (d) => String(d.faturavel).toLowerCase() === faturar.toLowerCase()
      );
    }

    if (faturarDesloc !== "--Todos--") {
      filtrados = filtrados.filter(
        (d) =>
          String(d.viagem_faturavel).toLowerCase() ===
          faturarDesloc.toLowerCase()
      );
    }

    console.log("Filtros aplicados:", {
      cliente,
      contrato,
      parceiro,
      utilizador,
      faturar,
      faturarDesloc,
    });
    console.log("Total filtrado:", filtrados.length);

    setDados(filtrados);
  };

  // 🟩 Exportar Excel
  const exportarExcel = () => {
    const colunas = [
      "Data",
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
      Local: d.local || "",
      Cliente: d.cliente || "",
      Parceiro: d.parceiro || "",
      Produto: d.produto || "",
      Contrato: d.contrato || "",
      Atividade: d.atividade || "",
      "Tempo Atividade": d.tempo_atividade || "00:00",
      "Tempo Faturado": d.tempo_faturado || "00:00",
      "Faturável": d.faturavel || "",
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
      Local: "",
      Cliente: "",
      Parceiro: "",
      Produto: "",
      Contrato: "",
      Atividade: "Total",
      "Tempo Atividade": totalTempoAtividade,
      "Tempo Faturado": totalTempoFaturado,
      "Faturável": "",
      "Viagem Faturável": "",
      "Valor (€)": totalValor.toFixed(2),
    });

    const ws = XLSX.utils.json_to_sheet(linhas, { header: colunas });

    ws["!cols"] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0078D7" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    const totalRowIndex = linhas.length;
    for (let C = 0; C < colunas.length; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E8EAF6" } },
        alignment: { horizontal: "right" },
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatórios");
    XLSX.writeFile(wb, "Relatorio_Atividades.xlsx");
  };

  // 🟥 Exportar PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text("Relatório de Atividades", 40, 40);

      const colunas = [
        "Data",
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
      const totalValor = dados.reduce((acc, d) => acc + (Number(d.valor_euro) || 0), 0);

      const totalRow = [
        "", "", "", "", "", "", "", "", "TOTAL",
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

      <div className="relatorios-main">
        <div className="filtros-container">
          <h3>Pesquisar</h3>

          <label>Ano Início</label>
          <select value={anoInicio} onChange={(e) => setAnoInicio(e.target.value)}>
            <option>2025</option>
            <option>2024</option>
          </select>

          <label>Mês Início</label>
          <select value={mesInicio} onChange={(e) => setMesInicio(e.target.value)}>
            <option>Outubro</option>
            <option>Setembro</option>
            <option>Agosto</option>
          </select>

          <label>Ano Fim</label>
          <select value={anoFim} onChange={(e) => setAnoFim(e.target.value)}>
            <option>2025</option>
            <option>2024</option>
          </select>

          <label>Mês Fim</label>
          <select value={mesFim} onChange={(e) => setMesFim(e.target.value)}>
            <option>Outubro</option>
            <option>Setembro</option>
            <option>Agosto</option>
          </select>

          <label>Faturar</label>
          <select value={faturar} onChange={(e) => setFaturar(e.target.value)}>
            <option>--Todos--</option>
            <option>Sim</option>
            <option>Não</option>
          </select>

          <label>Faturar Deslocações</label>
          <select
            value={faturarDesloc}
            onChange={(e) => setFaturarDesloc(e.target.value)}
          >
            <option>--Todos--</option>
            <option>Sim</option>
            <option>Não</option>
          </select>

          <label>Utilizador</label>
          <select value={utilizador} onChange={(e) => setUtilizador(e.target.value)}>
            <option>---Todos---</option>
            {utilizadores.map((u) => (
              <option key={u.id} value={u.nome}>
                {u.nome}
              </option>
            ))}
          </select>

          <label>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option>---Todos---</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>

          <label>Parceiro</label>
          <select value={parceiro} onChange={(e) => setParceiro(e.target.value)}>
            <option>---Todos---</option>
            {parceiros.map((p) => (
              <option key={p.id} value={p.parceiro}>
                {p.parceiro}
              </option>
            ))}
          </select>

          <label>Contrato</label>
          <select value={contrato} onChange={(e) => setContrato(e.target.value)}>
            <option>---Todos---</option>
            {contratosFiltrados.map((c) => (
              <option key={c.id} value={c.contrato}>
                {c.contrato}
              </option>
            ))}
          </select>

          <div className="filtro-botoes">
            <button onClick={aplicarFiltros}>Filtrar</button>
            <button
              onClick={() => {
                setDados(dadosOriginais);
                setCliente("---Todos---");
                setContrato("---Todos---");
                setUtilizador("---Todos---");
                setParceiro("---Todos---");
                setFaturar("--Todos--");
                setFaturarDesloc("--Todos--");
              }}
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        <div className="relatorios-table">
          <table>
            <thead>
              <tr>
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
    </div>
  );
};

export default RelatoriosPage;
