import React, { useState, useEffect } from "react";
import "./Agenda.css";
import api from "../services/api";

export default function Agenda() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [endDate, setEndDate] = useState(""); // 👈 novo campo de data fim
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("09:00");
  const [fim, setFim] = useState("18:00");
  const [dias, setDias] = useState(15);
  const [editingEvent, setEditingEvent] = useState(null);

  const token = localStorage.getItem("token");

  // const loggedUser = (() => {
  //   try {
  //     const stored = localStorage.getItem("user");
  //     return stored ? JSON.parse(stored).username : "";
  //   } catch {
  //     return "";
  //   }
  // })();

    


  // === Carregar utilizadores e eventos ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, agendaRes] = await Promise.all([
          api.get("/users", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/agenda", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setUsers(usersRes.data);
        setEvents(agendaRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };
    fetchData();
  }, []);

  // === Gerar lista de dias ===
  // === Gerar lista de dias da semana atual ===
// === Gerar lista de dias a partir da segunda-feira da semana atual ===
const getDias = () => {
  const lista = [];
  const hoje = new Date();

  // Obter o dia da semana (0 = domingo, 1 = segunda, ...)
  const diaSemana = hoje.getDay();

  // Calcular a data da segunda-feira desta semana
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() - ((diaSemana + 6) % 7)); // desloca até segunda-feira

  // Gerar o número de dias definido no dropdown (ex: 15, 30, 60...)
  for (let i = 0; i < dias; i++) {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    lista.push(d.toISOString().split("T")[0]);
  }

  return lista;
};

  const diasLista = getDias();

  // === Obter evento de um utilizador num dia ===
  const getEvent = (data, user) => {
    return events.find(
      (e) =>
        e.data === data &&
        e.utilizador?.toLowerCase() === user?.toLowerCase()
    );
  };

  // === Abrir modal (novo ou editar) ===
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


  // === Guardar ou atualizar marcação ===
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

    // Gerar lista de dias do intervalo
    const diasNoIntervalo = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      diasNoIntervalo.push(d.toISOString().split("T")[0]);
    }

    try {
      if (editingEvent) {
        // Atualizar marcação existente
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
        // Criar nova marcação para cada dia do intervalo
        for (const dataDia of diasNoIntervalo) {
          const newEvent = {
            utilizador: selectedUser,
            data: dataDia,
            hora_inicio: inicio,
            hora_fim: fim,
            descricao,
          };
          await api.post("/agenda", newEvent, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      // Recarregar lista
      const res = await api.get("/agenda", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao guardar marcação:", err);
      alert("Erro ao guardar marcação.");
    }
  };

  // === Eliminar evento ===
  const handleDelete = async () => {
    if (!editingEvent) return;
    if (!window.confirm("Tens a certeza que queres eliminar esta marcação?"))
      return;
    try {
      await api.delete(`/agenda/${editingEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await api.get("/agenda", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data);
      setShowModal(false);
    } catch (err) {
      console.error("Erro ao eliminar marcação:", err);
      alert("Erro ao eliminar marcação.");
    }
  };

    // === Verificar se é feriado nacional (fixo) ===
const isHoliday = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();

  const feriados = [
    new Date(year, 0, 1),  // 1 janeiro
    new Date(year, 3, 25), // 25 abril
    new Date(year, 4, 1),  // 1 maio
    new Date(year, 5, 10), // 10 junho
    new Date(year, 5, 24), // São João
    new Date(year, 7, 15), // 15 agosto
    new Date(year, 9, 5),  // 5 outubro
    new Date(year, 10, 1), // 1 novembro
    new Date(year, 11, 1), // 1 dezembro
    new Date(year, 11, 8), // 8 dezembro
    new Date(year, 11, 25), // 25 dezembro
  ];

  return feriados.some(
    (f) =>
      f.getDate() === date.getDate() &&
      f.getMonth() === date.getMonth()
  );
};

// === Verificar se é fim de semana ===
const isWeekend = (dateString) => {
  const day = new Date(dateString).getDay();
  return day === 0 || day === 6; // domingo (0) ou sábado (6)
};


  return (
    <div className="agenda-container">
      {/* <h2 className="agenda-title">📅 Agenda</h2> */}

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

      <div className="agenda-table-wrapper">
        <table className="agenda-table">
          <thead>
            <tr>
              <th>Data</th>
              {users.map((u) => (
                <th key={u.id}>{u.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
  {diasLista.map((data) => {
    const hoje = new Date().toISOString().split("T")[0];
    const isToday = data === hoje; // 👈 verifica se é o dia atual

    return (
      <tr key={data}>
        <td
          className="agenda-date"
          style={{
            backgroundColor: isToday ? "#f3e5f5" : "transparent", // 👈 roxo muito clarinho
            fontWeight: isToday ? "bold" : "normal", // opcional — realça o texto
          }}
        >
          {new Date(data).toLocaleDateString("pt-PT")}
        </td>

        {users.map((u) => {
          const evento = getEvent(data, u.username);

          // Determinar cor de fundo das células
          let bgColor = "transparent";

          if (isWeekend(data) || isHoliday(data)) {
            bgColor = "#d6d6d6";
          } else if (evento) {
            if (evento.descricao?.toLowerCase().includes("férias")) {
              bgColor = "#fff59d";
            } else {
              bgColor = "#c8e6c9";
            }
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingEvent ? "Editar Marcação" : "Adicionar Marcação"}</h3>

            {/* <div className="form-group">
              <label>Utilizador:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Selecione...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.nome}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div> */}

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
