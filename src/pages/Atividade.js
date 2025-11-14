import React, { useEffect, useState } from "react";
import Select from "react-select";
import api from "../services/api";
import "./Atividade.css";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

export default function Atividade() {
  const [dadosOriginais, setDadosOriginais] = useState([]);
  const [atividadesPorUser, setAtividadesPorUser] = useState({});
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);

  const [filtroUser, setFiltroUser] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("todos");

  const [listaUsers, setListaUsers] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);

  const [loading, setLoading] = useState(true);

  // ✅ Estilo igual ao resto da aplicação (TaskModal, Dashboard, etc.)
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

  // 🔹 Carregar atividades sempre que muda o mês
  useEffect(() => {
    const filtrarOuCarregar = async () => {
      await fetchAtividades();
    };
    filtrarOuCarregar();
  }, [mesSelecionado]);

  // 🔹 Aplicar filtros locais (sem recarregar do servidor)
  useEffect(() => {
    if (dadosOriginais.length > 0) {
      let filtrados = [...dadosOriginais];

      if (filtroUser !== "todos") filtrados = filtrados.filter((a) => a.username === filtroUser);
      if (filtroCliente !== "todos") filtrados = filtrados.filter((a) => a.cliente === filtroCliente);

      construirPivot(filtrados);
    }
  }, [filtroUser, filtroCliente]);

  // 🔹 Buscar dados do backend
  const fetchAtividades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await api.get(`/tasks/atividade?mes=${mesSelecionado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = res.data || [];

      if (dados.length === 0) {
        Swal.fire("Sem dados", "Não foram encontradas atividades para este mês.", "info");
      }

      setDadosOriginais(dados);
      setListaUsers([...new Set(dados.map((a) => a.username))]);
      setListaClientes([...new Set(dados.map((a) => a.cliente))]);
      construirPivot(dados);
      toast.success("Atividades carregadas com sucesso!");
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
      toast.error("Erro ao carregar atividades.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Construir tabela dinâmica (pivot)
  const construirPivot = (dados) => {
    if (!dados || dados.length === 0) {
      setAtividadesPorUser({});
      return;
    }

    const dadosPorUser = {};

    dados.forEach((a) => {
      const user = a.username;
      const dia = new Date(a.data).getDate();
      const [h, m] = a.tempo_atividade.split(":").map(Number);
      const horasDecimal = h + m / 60;

      if (!dadosPorUser[user]) dadosPorUser[user] = {};
      const userData = dadosPorUser[user];

      if (!userData[a.cliente]) userData[a.cliente] = {};
      userData[a.cliente][dia] = (userData[a.cliente][dia] || 0) + horasDecimal;
    });

    setAtividadesPorUser(dadosPorUser);
  };

  // 🔹 Aplicar filtros manuais
  const aplicarFiltros = () => {
    if (dadosOriginais.length === 0) {
      Swal.fire("Sem dados", "Não há dados para filtrar.", "info");
      return;
    }

    let filtrados = [...dadosOriginais];

    if (filtroUser !== "todos") filtrados = filtrados.filter((a) => a.username === filtroUser);
    if (filtroCliente !== "todos") filtrados = filtrados.filter((a) => a.cliente === filtroCliente);

    construirPivot(filtrados);
    toast.success("Filtros aplicados!");
  };

  // 🔹 Limpar filtros
  const limparFiltros = () => {
    if (dadosOriginais.length === 0) {
      toast("Nada para limpar.", { icon: "ℹ️", duration: 2000 });
      return;
    }

    setFiltroUser("todos");
    setFiltroCliente("todos");
    construirPivot(dadosOriginais);
    toast("Filtros limpos.", { icon: "🧹", duration: 2000 });
  };

  // 🔹 Listas auxiliares
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
  ];

  const diasNoMes = new Date(2025, mesSelecionado, 0).getDate();
  const mesOptions = meses.map((m, i) => ({ value: i + 1, label: m }));
  const userOptions = listaUsers.map((u) => ({ value: u, label: u }));
  const clienteOptions = listaClientes.map((c) => ({ value: c, label: c }));

  return (
  <div className="atividade-main">
    <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

    {/* === FILTROS === */}
    <div className="filtros-container">
      <h3>Filtros</h3>

      <label>Mês</label>
      <Select
        options={mesOptions}
        value={mesOptions.find((opt) => opt.value === mesSelecionado) || null}
        onChange={(selected) =>
          setMesSelecionado(selected ? selected.value : new Date().getMonth() + 1)
        }
        styles={customSelectStyles}
        placeholder="Seleciona o mês..."
        isSearchable={false}
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
      />

      <label>Utilizador</label>
      <Select
        options={[{ value: "todos", label: "Todos" }, ...userOptions]}
        value={
          filtroUser === "todos"
            ? { value: "todos", label: "Todos" }
            : userOptions.find((opt) => opt.value === filtroUser) || null
        }
        onChange={(selected) => setFiltroUser(selected ? selected.value : "todos")}
        styles={customSelectStyles}
        placeholder="Seleciona um utilizador..."
        isClearable
        isSearchable
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
      />

      <label>Cliente</label>
      <Select
        options={[{ value: "todos", label: "Todos" }, ...clienteOptions]}
        value={
          filtroCliente === "todos"
            ? { value: "todos", label: "Todos" }
            : clienteOptions.find((opt) => opt.value === filtroCliente) || null
        }
        onChange={(selected) => setFiltroCliente(selected ? selected.value : "todos")}
        styles={customSelectStyles}
        placeholder="Seleciona um cliente..."
        isClearable
        isSearchable
        classNamePrefix="react-select"
        menuPortalTarget={document.body}
      />

      <div className="filtro-botoes">
        <button onClick={aplicarFiltros}>Filtrar</button>
        <button onClick={limparFiltros}>Limpar</button>
      </div>
    </div>

    {/* === TABELA === */}
    <div className="atividade-container">
      <h2>Relatório de Atividade Mensal</h2>

      {loading ? (
        // 👉 spinner aparece só aqui
        <div className="spinner-container" style={{ marginTop: "40px" }}>
          <div className="spinner"></div>
          <p>A carregar atividades...</p>
        </div>
      ) : Object.keys(atividadesPorUser).length === 0 ? (
        <p className="sem-dados">Sem dados para este mês</p>
      ) : (
        Object.entries(atividadesPorUser).map(([user, pivotData]) => (
          <div key={user} className="atividade-tabela-user">
            <table className="atividade-table">
              <thead>
                <tr>
                  <th colSpan={diasNoMes + 2} style={{ backgroundColor: "#e9f2ff" }}>
                    {user}
                  </th>
                </tr>
                <tr>
                  <th></th>
                  {Array.from({ length: diasNoMes }, (_, i) => {
                    const dia = i + 1;
                    const data = new Date(2025, mesSelecionado - 1, dia);
                    const diaSemana = data.getDay();
                    const nomesDias = ["D", "2ª", "3ª", "4ª", "5ª", "6ª", "S"];
                    const label = nomesDias[diaSemana];
                    const isFimSemana = diaSemana === 0 || diaSemana === 6;
                    return (
                      <th key={`semana-${dia}`} className={isFimSemana ? "fim-semana" : ""}>
                        {label}
                      </th>
                    );
                  })}
                  <th></th>
                </tr>
                <tr>
                  <th>Cliente</th>
                  {Array.from({ length: diasNoMes }, (_, i) => {
                    const dia = i + 1;
                    const data = new Date(2025, mesSelecionado - 1, dia);
                    const diaSemana = data.getDay();
                    const isFimSemana = diaSemana === 0 || diaSemana === 6;
                    return (
                      <th key={dia} className={isFimSemana ? "fim-semana" : ""}>
                        {dia}
                      </th>
                    );
                  })}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(pivotData).map((cliente) => {
                  let totalCliente = 0;
                  return (
                    <tr key={cliente}>
                      <td>{cliente}</td>
                      {Array.from({ length: diasNoMes }, (_, i) => {
                        const dia = i + 1;
                        const data = new Date(2025, mesSelecionado - 1, dia);
                        const diaSemana = data.getDay();
                        const isFimSemana = diaSemana === 0 || diaSemana === 6;
                        const horas = pivotData[cliente][dia] || 0;
                        totalCliente += horas;
                        return (
                          <td key={dia} className={isFimSemana ? "fim-semana" : ""}>
                            {horas > 0 ? horas.toFixed(1) : ""}
                          </td>
                        );
                      })}
                      <td className="total-coluna">
                        <strong>{totalCliente > 0 ? totalCliente.toFixed(1) : ""}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  </div>
);

}
