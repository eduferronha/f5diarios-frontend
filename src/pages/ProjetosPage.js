import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../services/api";
import "./ProjetosPage.css";

const ProjetosPage = () => {
  const token = localStorage.getItem("token");

  const [projetos, setProjetos] = useState([]);
  const [projetosOriginais, setProjetosOriginais] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [contratosFiltrados, setContratosFiltrados] = useState([]);

  // Filtros
  const [cliente, setCliente] = useState("---Todos---");
  const [contrato, setContrato] = useState("---Todos---");

  // Campos do novo projeto
  const [novoCliente, setNovoCliente] = useState("");
  const [novoContrato, setNovoContrato] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horasContratadas, setHorasContratadas] = useState("");

  // 🟦 Carregar projetos
  useEffect(() => {
    const carregarProjetos = async () => {
      try {
        const res = await api.get("/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjetos(res.data);
        setProjetosOriginais(res.data);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
      }
    };
    carregarProjetos();
  }, []);

  // 🟦 Carregar listas de clientes e contratos
  useEffect(() => {
    const carregarListas = async () => {
      try {
        const [clientesRes, contratosRes] = await Promise.all([
          api.get("/clients", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/contracts", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setClientes(clientesRes.data);
        setContratos(contratosRes.data);
      } catch (error) {
        console.error("Erro ao carregar clientes/contratos:", error);
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
        (c) => c.cliente === cliente || c.cliente_nome === cliente
      );
      setContratosFiltrados(filtrados);
    }
  }, [cliente, contratos]);

  // 🟦 Filtrar contratos conforme cliente do novo projeto
  useEffect(() => {
    if (novoCliente) {
      const filtrados = contratos.filter(
        (c) => c.cliente === novoCliente || c.cliente_nome === novoCliente
      );
      setContratosFiltrados(filtrados);
    }
  }, [novoCliente, contratos]);

  // 🟦 Criar novo projeto
  const criarProjeto = async () => {
    if (!novoCliente || !novoContrato) {
      alert("Seleciona o cliente e o contrato.");
      return;
    }

    try {
      const body = {
        cliente: novoCliente,
        contrato: novoContrato,
        descricao: descricao,
        horas_contratadas: parseFloat(horasContratadas) || 0,
      };

      const res = await api.post("/projects", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Projeto criado com sucesso!");
      setProjetos([...projetos, res.data]);
      setProjetosOriginais([...projetosOriginais, res.data]);
      setNovoCliente("");
      setNovoContrato("");
      setDescricao("");
      setHorasContratadas("");
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      alert(error.response?.data?.detail || "Erro ao criar projeto.");
    }
  };

  // 🟦 Aplicar filtros
  const aplicarFiltros = () => {
    let filtrados = [...projetosOriginais];
    if (cliente !== "---Todos---") {
      filtrados = filtrados.filter((p) => p.cliente === cliente);
    }
    if (contrato !== "---Todos---") {
      filtrados = filtrados.filter((p) => p.contrato === contrato);
    }
    setProjetos(filtrados);
  };

  // 🟩 Exportar Excel
  const exportarExcel = () => {
    const colunas = ["Cliente", "Contrato", "Descrição", "Horas Contratadas", "Horas Gastas"];
    const linhas = projetos.map((p) => ({
      Cliente: p.cliente || "",
      Contrato: p.contrato || "",
      Descrição: p.descricao || "",
      "Horas Contratadas": p.horas_contratadas || 0,
      "Horas Gastas": p.horas_gastas || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(linhas, { header: colunas });

    ws["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projetos");
    XLSX.writeFile(wb, "Projetos.xlsx");
  };

  // 🟥 Exportar PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.text("Relatório de Projetos", 40, 40);

      const colunas = ["Cliente", "Contrato", "Descrição", "Horas Contratadas", "Horas Gastas"];
      const linhas = projetos.map((p) => [
        p.cliente || "",
        p.contrato || "",
        p.descricao || "",
        p.horas_contratadas || 0,
        p.horas_gastas || 0,
      ]);

      autoTable(doc, {
        head: [colunas],
        body: linhas,
        startY: 60,
        theme: "striped",
        styles: {
          fontSize: 9,
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
      });

      doc.save("Projetos.pdf");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao gerar PDF. Verifica a consola para detalhes.");
    }
  };

  return (
    <div className="projetos-container">
      <div className="projetos-header">
        <h2>Projetos</h2>
        <div className="projetos-actions">
          <button onClick={exportarExcel}>Exportar Excel</button>
          <button onClick={exportarPDF}>Exportar PDF</button>
        </div>
      </div>

      {/* 🟢 Formulário de criação */}
      <div className="novo-projeto-container">
        <h3>Criar Novo Projeto</h3>
        <div className="novo-projeto-form">
          <div>
            <label>Cliente</label>
            <select value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)}>
              <option value="">-- Selecionar Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Contrato</label>
            <select value={novoContrato} onChange={(e) => setNovoContrato(e.target.value)}>
              <option value="">-- Selecionar Contrato --</option>
              {contratosFiltrados.map((c) => (
                <option key={c.id} value={c.contrato}>
                  {c.contrato}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Descrição</label>
            <input
              type="text"
              placeholder="Descrição do projeto"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label>Horas Contratadas</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={horasContratadas}
              onChange={(e) => setHorasContratadas(e.target.value)}
            />
          </div>

          <button onClick={criarProjeto}>Criar Projeto</button>
        </div>
      </div>

      {/* 🟣 Filtros e tabela */}
      <div className="projetos-main">
        <div className="filtros-container">
          <h3>Filtros</h3>
          <label>Cliente</label>
          <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option>---Todos---</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
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
                setProjetos(projetosOriginais);
                setCliente("---Todos---");
                setContrato("---Todos---");
              }}
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="projetos-table">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contrato</th>
                <th>Descrição</th>
                <th>Horas Contratadas</th>
                <th>Horas Gastas</th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((p, i) => (
                <tr key={i}>
                  <td>{p.cliente}</td>
                  <td>{p.contrato}</td>
                  <td>{p.descricao}</td>
                  <td>{p.horas_contratadas}</td>
                  <td>{p.horas_gastas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjetosPage;
