import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import "./Agenda.css";
import api from "../services/api";

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

  const token = localStorage.getItem("token");

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

  // === Gerar lista de dias a partir de segunda ===
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

  // === Buscar evento ===
  const getEvent = (data, user) =>
    events.find(
      (e) =>
        e.data === data &&
        e.utilizador?.toLowerCase() === user?.toLowerCase()
    );

  // === Feriado e fim de semana ===
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

  // === Clicar numa célula ===
  const handleCellClick = (data, user) => {
    const existing = getEvent(data, user);
    if (existing) {
      setEditingEvent(existing);
      setDescricao(existing.descricao || "");
      setInicio(existing.hora_inicio || "09:00");
      setFim(existing.hora_fim || "18:00");
      setSelectedDate(existing.data);
      setSelectedUser(existing.utilizador || user);
    } else {
      setEditingEvent(null);
      setDescricao("");
      setInicio("09:00");
      setFim("18:00");
      setSelectedDate(data);
      setSelectedUser(user);
    }
    setShowModal(true);
  };

  // === Guardar / Atualizar ===
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
        await api.put(
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
      } else {
        for (const dataDia of diasNoIntervalo) {
          const newEvent = {
            utilizador: selectedUser,
            data: dataDia,
            hora_inicio: inicio,
            hora_fim: fim,
            descricao,
          };
          await api.post("/agenda/", newEvent, {
            headers: { Authorization: `Bearer ${token}` },
          });
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

  // === Eliminar ===
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

  // === Tabela dinâmica ===
  const columns = [
    {
      accessorKey: "data",
      header: "Data",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("pt-PT"),
    },
    ...users.map((u) => ({
      accessorKey: u.username,
      header: u.nome,
      cell: (info) => {
        const evento = getEvent(info.row.original.data, u.username);
        const data = info.row.original.data;

        let bgColor = "transparent";
        if (isWeekend(data) || isHoliday(data)) bgColor = "#d6d6d6";
        else if (evento) {
          bgColor = evento.descricao?.toLowerCase().includes("férias")
            ? "#fff59d"
            : "#c8e6c9";
        }

        return (
          <div
            className="agenda-cell"
            style={{ backgroundColor: bgColor }}
            onClick={() => handleCellClick(data, u.username)}
          >
            {evento && (
              <div className="event-info">
                <strong>{evento.descricao}</strong>
                <div>
                  {evento.hora_inicio} - {evento.hora_fim}
                </div>
              </div>
            )}
          </div>
        );
      },
    })),
  ];

  const data = diasLista.map((data) => ({ data }));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
        <div className="agenda-table-wrapper">
          <table className="agenda-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingEvent ? "Editar Marcação" : "Adicionar Marcação"}</h3>

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
              {editingEvent && (
                <button onClick={handleDelete} className="btn-delete">
                  Eliminar
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Fechar
              </button>
              <button onClick={handleSave} className="btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
