import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Agenda.css";
import api from "../services/api";
import { ArrowUp } from "lucide-react";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

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

  // 👉 Drag & Drop visual hover
  const [dragHoverKey, setDragHoverKey] = useState(null);

  // 👉 Saber se arrasto foi botão esquerdo ou direito
  const [dragButton, setDragButton] = useState("left");

  // 👉 Context menu para copiar/mover
  const [contextMenu, setContextMenu] = useState(null);

  const tableRef = useRef(null);
  const token = localStorage.getItem("token");

  // 🧩 Obter utilizador logado
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

      // Fecha o menu ao clicar fora
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

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
        toast.error("Erro ao carregar dados da agenda.");
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
        e.data === data &&
        e.utilizador?.toLowerCase?.() === user?.toLowerCase?.()
    );

  const handleCellClick = (data, user) => {
    const existing = getEvent(data, user);

    if (existing) {
      setEditingEvent(existing);
      setDescricao(existing.descricao || "");
      setInicio(existing.hora_inicio || "09:00");
      setFim(existing.hora_fim || "18:00");
      setSelectedDate(existing.data);
      setSelectedUser(existing.utilizador || user || "");
    } else {
      setEditingEvent(null);
      setDescricao("");
      setInicio("09:00");
      setFim("18:00");
      setSelectedDate(data);
      setSelectedUser(user || "");
    }

    setShowModal(true);
  };

  // =====================================================================================
  // === DRAG & DROP TOTALMENTE REFEITO (Mover com botão esquerdo / Menu com botão direito)
  // =====================================================================================

  const handleDragStartAgenda = (e, sourceEvent) => {
    // Detecta se foi botão esquerdo ou direito
    setDragButton(e.button === 2 ? "right" : "left");

    // Impede menu do browser no botão direito
    if (e.button === 2) {
      e.preventDefault();
    }

    const payload = JSON.stringify({
      descricao: sourceEvent.descricao || "",
      hora_inicio: sourceEvent.hora_inicio || "09:00",
      hora_fim: sourceEvent.hora_fim || "18:00",
      utilizador: sourceEvent.utilizador || "",
      data: sourceEvent.data || "",
      id: sourceEvent.id,
    });

    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleDragOverCellAgenda = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copyMove";
  };

  const handleDragEnterCellAgenda = (date, user) => {
    setDragHoverKey(`${date}__${user}`);
  };

  const handleDragLeaveCellAgenda = (date, user) => {
    const key = `${date}__${user}`;
    if (dragHoverKey === key) setDragHoverKey(null);
  };

  // ========================================================
  // === FUNÇÃO QUE ABRE O MENU COPIAR/MOVER (botão direito)
  // ========================================================
  const openCopyMoveMenu = (e, src, targetDate, targetUser) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      src,
      targetDate,
      targetUser,
    });
  };

  // =============================
  // === MOVER OU COPIAR EVENTOS
  // =============================
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

    const sameCell =
      src.utilizador?.toLowerCase?.() === targetUser?.toLowerCase?.() &&
      src.data === targetDate;

    if (sameCell) return;

    // =====================================================
    // === SE BOTÃO ESQUERDO → MOVER (delete + create)
    // =====================================================
    if (dragButton === "left") {
      try {
        await api.delete(`/agenda/${src.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        await api.post(
          "/agenda/",
          {
            utilizador: targetUser,
            data: targetDate,
            hora_inicio: src.hora_inicio,
            hora_fim: src.hora_fim,
            descricao: src.descricao,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const res = await api.get("/agenda/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setEvents(res.data || []);
        toast.success("Marcação movida!");
      } catch (err) {
        console.error("Erro ao mover marcação:", err);
        toast.error("Erro ao mover.");
      }
      return;
    }

    // =====================================================
    // === BOTÃO DIREITO → mostra menu contextual
    // =====================================================
    if (dragButton === "right") {
      openCopyMoveMenu(e, src, targetDate, targetUser);
      return;
    }
  };




  // ====== fim DnD ======

  const handleSave = useCallback(async () => {
    if (!selectedUser || !selectedDate || !descricao) {
      await Swal.fire({
        icon: "warning",
        title: "Campos obrigatórios",
        text: "Preenche todos os campos obrigatórios antes de guardar.",
        confirmButtonColor: "#237c9b",
      });
      return;
    }

    const start = new Date(selectedDate);
    const end = endDate ? new Date(endDate) : start;

    if (end < start) {
      await Swal.fire({
        icon: "error",
        title: "Datas inválidas",
        text: "A data de fim não pode ser anterior à data de início.",
        confirmButtonColor: "#237c9b",
      });
      return;
    }

    try {
      if (editingEvent) {
        // Intervalo de dias
        if (end > start) {
          // 🧹 Primeiro elimina antigas e cria novas
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
        } else {
          // Um único dia → atualiza ou cria
          const eventoExistente = events.find(
            (e) =>
              e.utilizador?.toLowerCase?.() === selectedUser.toLowerCase() &&
              e.data === selectedDate
          );

          if (eventoExistente) {
            await api.patch(
              `/agenda/${eventoExistente.id}`,
              {
                utilizador: selectedUser,
                data: selectedDate,
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
                data: selectedDate,
                hora_inicio: inicio,
                hora_fim: fim,
                descricao,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
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
      toast.success("Marcação guardada com sucesso!");
    } catch (err) {
      console.error("Erro ao guardar marcação:", err);
      toast.error("Erro ao guardar marcação.");
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

    const result = await Swal.fire({
      title: "Eliminar marcação?",
      text: "Esta ação não pode ser revertida.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#237c9b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

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
      toast.success("Marcação eliminada com sucesso!");
    } catch (err) {
      console.error("Erro ao eliminar marcação:", err);
      toast.error("Erro ao eliminar marcação.");
    }
  }, [editingEvent, selectedDate, endDate, events, selectedUser, token]);

  // ✅ Fechar modal com confirmação (igual TaskModal)
  const handleCloseAgenda = useCallback(async () => {
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
      const result = await Swal.fire({
        title: "Sair sem guardar?",
        text: "Existem alterações por guardar. Tens a certeza que queres sair?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#237c9b",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, sair",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) return;
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
      {/* <Toaster position="top-center" reverseOrder={false} /> */}

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
                            draggable={!!evento}                              // 👈 célula inteira arrastável se houver evento
                            onDragStart={(e) => evento && handleDragStartAgenda(e, evento)}  // 👈 usa o evento da célula
                            title={
                              evento
                                ? `${evento.descricao} (${evento.hora_inicio} - ${evento.hora_fim})`
                                : ""
                            }
                          >
                            {evento && (
                              <div className="event-info-agenda">
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

            {/* ========================================================= */}
      {/* === MENU CONTEXTUAL (COPIAR / MOVER) ===================== */}
      {/* ========================================================= */}
      {contextMenu && (
        <div
          className="agenda-context-menu"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "8px 0",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            width: "140px",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              borderBottom: "1px solid #eee",
            }}
            onClick={async () => {
              try {
                await api.post(
                  "/agenda/",
                  {
                    utilizador: contextMenu.targetUser,
                    data: contextMenu.targetDate,
                    hora_inicio: contextMenu.src.hora_inicio,
                    hora_fim: contextMenu.src.hora_fim,
                    descricao: contextMenu.src.descricao,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                const res = await api.get("/agenda/", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setEvents(res.data || []);
                toast.success("Marcação copiada!");
              } catch (err) {
                toast.error("Erro ao copiar.");
              }
              setContextMenu(null);
            }}
          >
            Copiar
          </div>

          <div
            style={{
              padding: "8px 12px",
              cursor: "pointer",
            }}
            onClick={async () => {
              try {
                await api.delete(`/agenda/${contextMenu.src.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                await api.post(
                  "/agenda/",
                  {
                    utilizador: contextMenu.targetUser,
                    data: contextMenu.targetDate,
                    hora_inicio: contextMenu.src.hora_inicio,
                    hora_fim: contextMenu.src.hora_fim,
                    descricao: contextMenu.src.descricao,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                const res = await api.get("/agenda/", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setEvents(res.data || []);
                toast.success("Marcação movida!");
              } catch (err) {
                toast.error("Erro ao mover.");
              }
              setContextMenu(null);
            }}
          >
            Mover
          </div>
        </div>
      )}

      
    </div>
  );
}
