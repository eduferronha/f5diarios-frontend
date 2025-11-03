import React, { useState, useEffect } from "react";
import "./CalendarDashboard.css";

function CalendarDashboard({ tasks = [] }) {
  const [hoursPerDay, setHoursPerDay] = useState({});
  const [vacationDays, setVacationDays] = useState([]); // 🟨 guardar dias de férias
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // === Calcular Páscoa (algoritmo de Meeus/Jones/Butcher) ===
  const getEasterDate = (year) => {
    const f = Math.floor,
      G = year % 19,
      C = f(year / 100),
      H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
      I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
      J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
      L = I - J,
      month = 3 + f((L + 40) / 44),
      day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
  };

  // === Feriados nacionais portugueses ===
  const getPortugueseHolidays = (year) => {
    const easter = getEasterDate(year);
    return [
      new Date(year, 0, 1), // 1 janeiro
      new Date(year, 3, 25), // 25 abril
      new Date(year, 4, 1), // 1 maio
      new Date(year, 5, 10), // 10 junho
      new Date(year, 5, 24), // São João
      new Date(year, 7, 15), // 15 agosto
      new Date(year, 9, 5), // 5 outubro
      new Date(year, 10, 1), // 1 novembro
      new Date(year, 11, 1), // 1 dezembro
      new Date(year, 11, 8), // 8 dezembro
      new Date(year, 11, 25), // 25 dezembro
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2), // Sexta-feira Santa
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate()), // Domingo de Páscoa
      new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 60), // Corpo de Deus
    ];
  };

  const holidays = getPortugueseHolidays(currentMonth.getFullYear());

  // === Calcular horas por dia e dias de férias ===
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setHoursPerDay({});
      setVacationDays([]);
      return;
    }

    const hoursMap = {};
    const vacations = [];

    tasks.forEach((task) => {
      if (!task.data) return;

      const date = new Date(task.data);
      if (
        date.getMonth() === currentMonth.getMonth() &&
        date.getFullYear() === currentMonth.getFullYear()
      ) {
        const day = date.getDate();

        // 🟨 marcar férias
        const isVacation =
          task.atividade &&
          task.atividade.toLowerCase().includes("férias");
        if (isVacation) {
          vacations.push(day);
        }

        // 🕒 contabilizar tempo
        if (task.tempo_atividade) {
          const [h, m] = task.tempo_atividade.split(":").map(Number);
          const total = h + m / 60;
          hoursMap[day] = (hoursMap[day] || 0) + total;
        }
      }
    });

    setHoursPerDay({ ...hoursMap });
    setVacationDays([...new Set(vacations)]); // remove duplicados
  }, [tasks, currentMonth]);

  // === Gerar os dias do mês ===
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDayOfWeek = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  // === Definir cor do dia ===
  const getDayColor = (date, hours) => {
    const dayOfWeek = date.getDay();
    const day = date.getDate();

    // 🟨 Dia de férias → amarelo
    if (vacationDays.includes(day)) return "#ffeb3b";

    // 🟡 Feriado → amarelo claro
    const isHoliday = holidays.some(
      (h) =>
        h.getDate() === date.getDate() &&
        h.getMonth() === date.getMonth() &&
        h.getFullYear() === date.getFullYear()
    );
    if (isHoliday) return "#fff176";

    // 🔴 Fim de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) return "#ef5350";

    // 🟦 Dias úteis normais → pela carga horária
    if (!hours) return "#e0e0e0"; // sem tarefas
    if (hours < 8) return "#b3e5fc";
    if (hours === 8) return "#81c784";
    if (hours > 8) return "#388e3c";
  };

  // === Navegação entre meses ===
  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header-row">
        <button onClick={() => changeMonth(-1)} className="month-btn">‹</button>
        <h2>
          {`${currentMonth.toLocaleString("pt-PT", { month: "long" })} ${currentMonth.getFullYear()}`}
        </h2>
        <button onClick={() => changeMonth(1)} className="month-btn">›</button>
      </div>

      <div className="calendar-grid">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="calendar-header">{d}</div>
        ))}

        {Array(firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1)
          .fill(null)
          .map((_, i) => (
            <div key={"empty" + i} className="calendar-day empty"></div>
          ))}

        {monthDays.map((day) => {
          const dayNum = day.getDate();
          const totalHours = hoursPerDay[dayNum] || 0;
          const color = getDayColor(day, totalHours);
          const isVacation = vacationDays.includes(dayNum);

          return (
            <div
              key={dayNum}
              className="calendar-day"
              style={{
                backgroundColor: color,
                border: isVacation ? "2px solid #fbc02d" : "none",
              }}
              title={
                isVacation
                  ? `${dayNum}/${currentMonth.getMonth() + 1}: Férias`
                  : `${dayNum}/${currentMonth.getMonth() + 1}: ${totalHours.toFixed(1)}h`
              }
            >
              {dayNum}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#ffeb3b" }}></div> Férias
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#fff176" }}></div> Feriado
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#ef5350" }}></div> Fim de semana
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#e0e0e0" }}></div> 0h
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#b3e5fc" }}></div> &lt; 8h
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#81c784" }}></div> 8h
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: "#388e3c" }}></div> &gt; 8h
        </div>
      </div>
    </div>
  );
}

export default CalendarDashboard;
