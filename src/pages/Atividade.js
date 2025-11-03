import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./Atividade.css";

export default function Atividade() {
  const [dadosOriginais, setDadosOriginais] = useState([]);
  const [atividadesPorUser, setAtividadesPorUser] = useState({});
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);

  const [filtroUser, setFiltroUser] = useState("todos");
  const [filtroCliente, setFiltroCliente] = useState("todos");

  const [listaUsers, setListaUsers] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);

  useEffect(() => {
    fetchAtividades();
  }, [mesSelecionado]);

  const fetchAtividades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/tasks/atividade?mes=${mesSelecionado}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = res.data || [];

      // Guardar todos os dados originais (sem filtros)
      setDadosOriginais(dados);

      // Atualizar listas únicas de utilizadores e clientes
      setListaUsers([...new Set(dados.map((a) => a.username))]);
      setListaClientes([...new Set(dados.map((a) => a.cliente))]);

      // Criar tabela com todos os dados por defeito
      construirPivot(dados);
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
    }
  };

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

  const aplicarFiltros = () => {
    let filtrados = [...dadosOriginais];

    if (filtroUser !== "todos") {
      filtrados = filtrados.filter((a) => a.username === filtroUser);
    }

    if (filtroCliente !== "todos") {
      filtrados = filtrados.filter((a) => a.cliente === filtroCliente);
    }

    construirPivot(filtrados);
  };

  const limparFiltros = () => {
    setFiltroUser("todos");
    setFiltroCliente("todos");
    construirPivot(dadosOriginais); // volta a mostrar tudo
  };

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const diasNoMes = new Date(2025, mesSelecionado, 0).getDate();

  return (
    <div className="atividade-main">
      {/* === Sidebar de Filtros === */}
      <div className="filtros-container">
        <h3>Filtros</h3>

        <label>Mês</label>
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(Number(e.target.value))}
        >
          {meses.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <label>Utilizador</label>
        <select value={filtroUser} onChange={(e) => setFiltroUser(e.target.value)}>
          <option value="todos">--- Todos ---</option>
          {listaUsers.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <label>Cliente</label>
        <select
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
        >
          <option value="todos">--- Todos ---</option>
          {listaClientes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="filtro-botoes">
          <button onClick={aplicarFiltros}>Filtrar</button>
          <button onClick={limparFiltros}>Limpar</button>
        </div>
      </div>

      {/* === Conteúdo principal (tabelas) === */}
      <div className="atividade-container">
        <h2>Relatório de Atividade Mensal</h2>

        {Object.keys(atividadesPorUser).length === 0 ? (
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
