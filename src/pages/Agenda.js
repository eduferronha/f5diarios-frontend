import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // 👉 estado visual do DnD
  const [dragHoverKey, setDragHoverKey] = useState(null); // `${date}__${user}`

  const tableRef = useRef(null);
  const token = localStorage.getItem("token");

  // 🧩 Obter utilizador logado (parse seguro)
  let storedUser = null;
  try {
    const raw = localStorage.getItem("user");
    storedUser = raw ? JSON.parse(raw) : null;
  } catch {
    storedUser = null;
  }
  const loggedUsername = storedUser?.username?.toLowerCase?.() || "";

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
        setUsers(usersRes.data || []);
        setEvents(agendaRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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
        e.data === data && e.utilizador?.toLowerCase?.() === user?.toLowerCase?.()
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
      setSelectedUser(existing.utilizador || user || "");
    } else {
      // --- Criar nova marcação ---
      setEditingEvent(null);
      setDescricao("");
      setInicio("09:00");
      setFim("18:00");
      setSelectedDate(data);
      setSelectedUser(user || ""); // 👈 preenche automaticamente com o nome da coluna
    }

    setShowModal(true);
  };

  // ====== Drag & Drop: duplicar no destino ======
  const handleDragStartAgenda = (e, sourceEvent) => {
    // guardamos info essencial no dataTransfer
    const payload = JSON.stringify({
      descricao: sourceEvent.descricao || "",
      hora_inicio: sourceEvent.hora_inicio || "09:00",
      hora_fim: sourceEvent.hora_fim || "18:00",
      utilizador: sourceEvent.utilizador || "",
      data: sourceEvent.data || "",
      id: sourceEvent.id,
    });
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOverCellAgenda = (e) => {
    e.preventDefault(); // necessário para permitir drop
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnterCellAgenda = (date, user) => {
    setDragHoverKey(`${date}__${user}`);
  };

  const handleDragLeaveCellAgenda = (date, user) => {
    const key = `${date}__${user}`;
    if (dragHoverKey === key) setDragHoverKey(null);
  };

  const handleDropOnCellAgenda = async (e, targetDate, targetUser) => {
    e.preventDefault();
    setDragHoverKey(null);

    let dataText = e.dataTransfer.getData("text/plain");
    if (!dataText) return;
    let src;
    try {
      src = JSON.parse(dataText);
    } catch {
      return;
    }

    // Se for o mesmo destino (mesmo utilizador e mesma data), ignoramos
    if (
      src.utilizador?.toLowerCase?.() === targetUser?.toLowerCase?.() &&
      src.data === targetDate
    ) {
      return;
    }

    // Se já existe evento no destino, perguntar se quer criar mais um (duplicado no mesmo dia)
    const existsAtTarget = events.some(
      (e) =>
        e.utilizador?.toLowerCase?.() === targetUser?.toLowerCase?.() &&
        e.data === targetDate
    );
    if (existsAtTarget) {
      const ok = window.confirm(
        "Já existe uma marcação nesse dia/utilizador. Queres criar MAIS UMA marcação no mesmo destino?"
      );
      if (!ok) return;
    }

    // Criar novo no destino com os mesmos dados (duplicar)
    try {
      await api.post(
        "/agenda/",
        {
          utilizador: targetUser,
          data: targetDate,
          hora_inicio: src.hora_inicio || "09:00",
          hora_fim: src.hora_fim || "18:00",
          descricao: src.descricao || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const res = await api.get("/agenda/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data || []);
    } catch (err) {
      console.error("Erro ao duplicar marcação por drag & drop:", err);
      alert("Erro ao duplicar marcação.");
    }
  };
  // ====== fim DnD ======

  const handleSave = useCallback(async () => {
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

    try {
      if (editingEvent) {
        // Intervalo de dias
        if (end > start) {
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dataDia = d.toISOString().split("T")[0];
            const eventoExistente = events.find(
              (e) =>
                e.utilizador?.toLowerCase?.() === selectedUser.toLowerCase() &&
                e.data === dataDia
            );

            if (eventoExistente) {
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
          // Um único dia
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
      } else {
        // Criar nova marcação (pode ser intervalo)
        const endEff = endDate ? new Date(endDate) : start;
        for (let d = new Date(start); d <= endEff; d.setDate(d.getDate() + 1)) {
          const dataDia = d.toISOString().split("T")[0];
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

      const res = await api.get("/agenda/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data || []);
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao guardar marcação:", err);
      alert("Erro ao guardar marcação.");
    }
  }, [
    descricao,
    inicio,
    fim,
    endDate,
    selectedUser,
    selectedDate,
    editingEvent,
    events,
    token,
  ]);

  const handleDelete = useCallback(async () => {
    if (!editingEvent) return;

    if (!window.confirm("Tens a certeza que queres eliminar esta(s) marcação(ões)?"))
      return;

    try {
      const start = new Date(selectedDate);
      const end = endDate ? new Date(endDate) : start;

      if (end <= start) {
        await api.delete(`/agenda/${editingEvent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dataDia = d.toISOString().split("T")[0];
          const eventoExistente = events.find(
            (e) =>
              e.utilizador?.toLowerCase?.() === selectedUser.toLowerCase() &&
              e.data === dataDia
          );
          if (eventoExistente) {
            await api.delete(`/agenda/${eventoExistente.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }

      const res = await api.get("/agenda/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data || []);
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao eliminar marcação:", err);
      alert("Erro ao eliminar marcação.");
    }
  }, [editingEvent, selectedDate, endDate, events, selectedUser, token]);

  // ✅ Fechar modal com confirmação (igual TaskModal)
  const handleCloseAgenda = useCallback(() => {
    const hasChanges =
      (descricao && descricao.trim() !== "") ||
      (inicio && inicio !== "09:00") ||
      (fim && fim !== "18:00") ||
      (endDate && endDate !== "") ||
      (selectedUser && selectedUser !== "") ||
      (editingEvent &&
        (
          descricao !== (editingEvent.descricao || "") ||
          inicio !== (editingEvent.hora_inicio || "09:00") ||
          fim !== (editingEvent.hora_fim || "18:00") ||
          selectedDate !== (editingEvent.data || selectedDate)
        ));

    if (hasChanges) {
      const confirmExit = window.confirm(
        "Existem dados preenchidos. Tens a certeza que queres sair sem guardar?"
      );
      if (!confirmExit) return;
    }

    setShowModal(false);
  }, [descricao, inicio, fim, endDate, selectedUser, selectedDate, editingEvent]);

  // ⌨️ Enter/ESC quando a modal está aberta
  useEffect(() => {
    if (!showModal) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const form = document.getElementById("form-agenda");
        if (form) form.requestSubmit();
        else handleSave();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseAgenda();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, handleSave, handleCloseAgenda]);

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
    <div className="agenda-container-agenda">
      <div className="agenda-controls-agenda">
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
        <div className="spinner-container-agenda">
          <div className="spinner-agenda"></div>
          <p>A carregar agenda...</p>
        </div>
      ) : (
        <>
          <div className="agenda-table-wrapper-agenda" ref={tableRef}>
            <table className="agenda-table-agenda">
              <thead>
                <tr>
                  <th>Data</th>
                  {usersSorted.map((u) => (
                    <th
                      key={u.id}
                      className={
                        u.username?.toLowerCase?.() === loggedUsername
                          ? "header-active-agenda"
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
                        className="agenda-date-agenda"
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

                        if (isWeekend(data) || isHoliday(data)) bgColor = "#d6d6d6";
                        else if (evento) {
                          bgColor = evento.descricao?.toLowerCase?.().includes("férias")
                            ? "#fff59d"
                            : "#c8e6c9";
                        }

                        const cellKey = `${data}__${u.username}`;
                        const isHover = dragHoverKey === cellKey;

                        return (
                          <td
                            key={u.id}
                            className={`agenda-cell-agenda ${isHover ? "drop-target-agenda" : ""}`}
                            style={{ backgroundColor: bgColor }}
                            onClick={() => handleCellClick(data, u.username)}
                            onDragOver={handleDragOverCellAgenda}
                            onDragEnter={() => handleDragEnterCellAgenda(data, u.username)}
                            onDragLeave={() => handleDragLeaveCellAgenda(data, u.username)}
                            onDrop={(e) => handleDropOnCellAgenda(e, data, u.username)}
                            title={
                              evento
                                ? `${evento.descricao} (${evento.hora_inicio} - ${evento.hora_fim})`
                                : ""
                            }
                          >
                            {evento && (
                              <div
                                className="event-info-agenda"
                                draggable
                                onDragStart={(e) => handleDragStartAgenda(e, evento)}
                              >
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
            <div className="scroll-btn-container-agenda">
              <button
                className="scroll-top-btn-agenda"
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
        <div className="agenda-modal-overlay-agenda" onClick={handleCloseAgenda}>
          <div className="agenda-modal-agenda" onClick={(e) => e.stopPropagation()}>
            <h3>{editingEvent ? "Editar Marcação" : "Nova Marcação"}</h3>

            <form
              id="form-agenda"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <div className="form-group-agenda">
                <label>Início Marcação:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group-agenda">
                <label>Fim Marcação:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="form-group-agenda">
                <label>Início:</label>
                <input
                  type="time"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
              </div>

              <div className="form-group-agenda">
                <label>Fim:</label>
                <input
                  type="time"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                />
              </div>

              <div className="form-group-agenda">
                <label>Descrição:</label>
                <input
                  type="text"
                  placeholder="Descrição do evento"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div className="modal-buttons-agenda">
                <button type="submit" className="btn-agenda btn-primary-agenda">
                  {editingEvent ? "Guardar" : "Guardar"}
                </button>

                {editingEvent && (
                  <button
                    type="button"
                    className="btn-agenda btn-danger-agenda"
                    onClick={handleDelete}
                  >
                    Eliminar
                  </button>
                )}

                <button
                  type="button"
                  className="btn-agenda btn-secondary-agenda"
                  onClick={handleCloseAgenda}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
