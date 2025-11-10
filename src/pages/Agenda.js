import React, { useState, useEffect, useRef } from "react";
import "./Agenda.css";
import api from "../services/api";
import { ArrowUp } from "lucide-react";

export default function Agenda() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [endDate, setEndDate] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("09:00");
  const [fim, setFim] = useState("18:00");
  const [dias, setDias] = useState(15);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScroll, setShowScroll] = useState(false);

  const tableRef = useRef(null);
  const token = localStorage.getItem("token");

  // 🧩 Obter utilizador logado
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const loggedUsername = storedUser?.username?.toLowerCase() || "";

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const handleScroll = () => setShowScroll(table.scrollTop > 150);
    table.addEventListener("scroll", handleScroll);
    return () => table.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, agendaRes] = await Promise.all([
          api.get("/users/", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/agenda/", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUsers(usersRes.data);
        setEvents(agendaRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // === Gerar lista de dias ===
  const getDias = () => {
    const lista = [];
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const segunda = new Date(hoje);
    segunda.setDate(hoje.getDate() - ((diaSemana + 6) % 7));
    for (let i = 0; i < dias; i++) {
      const d = new Date(segunda);
      d.setDate(segunda.getDate() + i);
      lista.push(d.toISOString().split("T")[0]);
    }
    return lista;
  };

  const diasLista = getDias();

  const getEvent = (data, user) =>
    events.find(
      (e) =>
        e.data === data && e.utilizador?.toLowerCase() === user?.toLowerCase()
    );

  const handleCellClick = (data, user) => {
    const existing = getEvent(data, user);

    if (existing) {
      // --- Editar marcação existente ---
      setEditingEvent(existing);
      setDescricao(existing.descricao || "");
      setInicio(existing.hora_inicio || "09:00");
      setFim(existing.hora_fim || "18:00");
      setSelectedDate(existing.data);
      setSelectedUser(existing.utilizador || user);
    } else {
      // --- Criar nova marcação ---
      setEditingEvent(null);
      setDescricao("");
      setInicio("09:00");
      setFim("18:00");
      setSelectedDate(data);
      setSelectedUser(user); // 👈 preenche automaticamente com o nome da coluna
    }

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedUser || !selectedDate || !descricao) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const start = new Date(selectedDate);
    const end = endDate ? new Date(endDate) : start;

    if (end < start) {
      alert("A data de fim não pode ser anterior à data de início.");
      return;
    }

    const diasNoIntervalo = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      diasNoIntervalo.push(d.toISOString().split("T")[0]);
    }

    try {
      if (editingEvent) {
      // Verifica se há intervalo
      if (end > start) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dataDia = d.toISOString().split("T")[0];
          // Procura se há evento para esse utilizador e data
          const eventoExistente = events.find(
            (e) =>
              e.utilizador?.toLowerCase() === selectedUser.toLowerCase() &&
              e.data === dataDia
          );

          if (eventoExistente) {
            // Atualiza evento existente
            await api.patch(
              `/agenda/${eventoExistente.id}`,
              {
                utilizador: selectedUser,
                data: dataDia,
                hora_inicio: inicio,
                hora_fim: fim,
                descricao,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
            // Cria novo se não existir
            await api.post(
              "/agenda/",
              {
                utilizador: selectedUser,
                data: dataDia,
                hora_inicio: inicio,
                hora_fim: fim,
                descricao,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
      } else {
        // Caso normal: apenas um evento
        await api.patch(
          `/agenda/${editingEvent.id}`,
          {
            utilizador: selectedUser,
            data: selectedDate,
            hora_inicio: inicio,
            hora_fim: fim,
            descricao,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    }


      const res = await api.get("/agenda/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao guardar marcação:", err);
      alert("Erro ao guardar marcação.");
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (!window.confirm("Tens a certeza que queres eliminar esta marcação?"))
      return;
    try {
      await api.delete(`/agenda/${editingEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await api.get("/agenda/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao eliminar marcação:", err);
      alert("Erro ao eliminar marcação.");
    }
  };

  const isHoliday = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const feriados = [
      new Date(year, 0, 1),
      new Date(year, 3, 25),
      new Date(year, 4, 1),
      new Date(year, 5, 10),
      new Date(year, 5, 24),
      new Date(year, 7, 15),
      new Date(year, 9, 5),
      new Date(year, 10, 1),
      new Date(year, 11, 1),
      new Date(year, 11, 8),
      new Date(year, 11, 25),
    ];
    return feriados.some(
      (f) => f.getDate() === date.getDate() && f.getMonth() === date.getMonth()
    );
  };

  const isWeekend = (dateString) => {
    const day = new Date(dateString).getDay();
    return day === 0 || day === 6;
  };

  const usersSorted = [...users].sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "", "pt", { sensitivity: "base" })
  );



  return (
    <div className="agenda-container">
      <div className="agenda-controls">
        <label>Nº Dias:</label>
        <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
          <option value={7}>7</option>
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
          <option value={90}>90</option>
        </select>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>A carregar agenda...</p>
        </div>
      ) : (
        <>
          <div className="agenda-table-wrapper" ref={tableRef}>
            <table className="agenda-table">
              <thead>
                <tr>
                  <th>Data</th>
                  {usersSorted.map((u) => (
                    <th
                      key={u.id}
                      className={
                        u.username.toLowerCase() === loggedUsername
                          ? "header-active"
                          : ""
                      }
                    >
                      {u.nome}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diasLista.map((data) => {
                  const hoje = new Date().toISOString().split("T")[0];
                  const isToday = data === hoje;
                  return (
                    <tr key={data}>
                      <td
                        className="agenda-date"
                        style={{
                          backgroundColor: isToday ? "#f3e5f5" : "transparent",
                          fontWeight: isToday ? "bold" : "normal",
                        }}
                      >
                        {new Date(data).toLocaleDateString("pt-PT")}
                      </td>
                      {usersSorted.map((u) => {
                        const evento = getEvent(data, u.username);
                        let bgColor = "transparent";

                        if (isWeekend(data) || isHoliday(data))
                          bgColor = "#d6d6d6";
                        else if (evento) {
                          bgColor = evento.descricao
                            ?.toLowerCase()
                            .includes("férias")
                            ? "#fff59d"
                            : "#c8e6c9";
                        }

                        return (
                          <td
                            key={u.id}
                            className="agenda-cell"
                            style={{ backgroundColor: bgColor }}
                            onClick={() => handleCellClick(data, u.username)}
                            title={
                              evento
                                ? `${evento.descricao} (${evento.hora_inicio} - ${evento.hora_fim})`
                                : ""
                            }
                          >
                            {evento && (
                              <div className="event-info">
                                <strong>{evento.descricao}</strong>
                                <div>
                                  {evento.hora_inicio} - {evento.hora_fim}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 👇 Botão agora por DEBAIXO da tabela */}
          {showScroll && (
            <div className="scroll-btn-container">
              <button
                className="scroll-top-btn"
                onClick={scrollToTop}
                aria-label="Voltar ao topo"
              >
                <ArrowUp size={22} />
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
  <div className="agenda-modal-overlay" onClick={() => setShowModal(false)}>
    <div className="agenda-modal" onClick={(e) => e.stopPropagation()}>
      <h3>{editingEvent ? "Editar Marcação" : "Nova Marcação"}</h3>

            <div className="form-group">
              <label>Início Marcação:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Fim Marcação:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Início:</label>
              <input
                type="time"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Fim:</label>
              <input
                type="time"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Descrição:</label>
              <input
                type="text"
                placeholder="Descrição do evento"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

      <div className="modal-buttons">
        <button onClick={handleSave}>
          {editingEvent ? "Guardar Alterações" : "Guardar"}
        </button>
        {editingEvent && <button onClick={handleDelete}>Eliminar</button>}
        <button onClick={() => setShowModal(false)}>Cancelar</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
