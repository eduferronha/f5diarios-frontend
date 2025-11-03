import React, { useState, useEffect } from "react";
import api from "../services/api";
import TaskModal from "../components/TaskModel";
import CalendarDashboard from "../components/CalendarDashboard";
import PresetsModal from "../components/PresetsModal";
import "./DashboardTable.css";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false); // ✅ novo estado
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const [showPresets, setShowPresets] = useState(false);
  const [presetToApply, setPresetToApply] = useState(null);

  // ✅ Corrigido
  const storedUser = localStorage.getItem("user");
  const username = storedUser ? JSON.parse(storedUser).username : null;

  
  const [datasDuplicadas, setDatasDuplicadas] = useState([]);


  const token = localStorage.getItem("token");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      if (error.response?.status === 401)
        alert("Sessão expirada. Faça login novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const filtradas = tasks.filter((task) => {
      if (!task.data) return false;
      const data = new Date(task.data);
      return (
        data.getFullYear() === Number(selectedYear) &&
        data.getMonth() === Number(selectedMonth)
      );
    });
    filtradas.sort((a, b) => new Date(a.data) - new Date(b.data));
    setFilteredTasks(filtradas);
  }, [tasks, selectedYear, selectedMonth]);

  const handleDelete = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar esta tarefa?")) return;
    try {
      await api.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch (error) {
      console.error("Erro ao eliminar tarefa:", error);
      alert("Erro ao eliminar tarefa.");
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsDuplicate(false); // ✅ edição normal
    setShowModal(true);
  };

  const handleDuplicate = (task) => {
    // ✅ cria cópia mas sem o ID
    const duplicatedTask = { ...task };
    delete duplicatedTask.id;
    delete duplicatedTask._id;

    setEditingTask(duplicatedTask);
    setIsDuplicate(true); // ✅ modo duplicar
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setShowModal(false);
    setIsDuplicate(false);
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-calendar">
        <CalendarDashboard tasks={tasks} />
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-filtros">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {[
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
              ].map((mes, index) => (
                <option key={index} value={index}>
                  {mes}
                </option>
              ))}
            </select>
          </div>

          <h1>As minhas tarefas</h1>



          {/* <button
            className="btn-add"
            onClick={() => {
              setEditingTask(null);
              setIsDuplicate(false);
              setShowModal(true);
            }}
          >
            + Nova Tarefa
          </button> */}

          <div className="dashboard-buttons">
            <button
              className="btn-secondary"
              onClick={() => setShowPresets(true)}
            >
              ⚙️ Presets
            </button>

            <button
              className="btn-add"
              onClick={() => {
                setEditingTask(null);
                setIsDuplicate(false);
                setShowModal(true);
              }}
            >
              + Nova Tarefa
            </button>
          </div>

        </div>

        {loading ? (
          <p className="loading">A carregar tarefas...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="no-tasks">Sem tarefas neste mês.</p>
        ) : (
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Local</th>
                  <th>Customer</th>
                  <th>Partner</th>
                  <th>Product</th>
                  <th>Activity</th>
                  <th>Duration</th>
                  <th>Bill</th>
                  <th>Bill Travel</th>
                  <th>Value (€)</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{new Date(task.data).getDate()}</td>
                    <td>{task.local}</td>
                    <td>{task.cliente}</td>
                    <td>{task.parceiro || "Sem Parceiro"}</td>
                    <td>{task.produto}</td>
                    <td>{task.atividade}</td>
                    <td>{task.tempo_atividade}</td>
                    <td>{task.tempo_faturado}</td>
                    <td>{task.viagem_faturavel}</td>
                    <td>{task.valor_euro?.toFixed(0) || 0}</td>
                    <td className="task-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(task)}
                        title="Editar tarefa"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-duplicate"
                        onClick={() => handleDuplicate(task)}
                        title="Duplicar tarefa"
                      >
                        ⧉
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(task.id)}
                        title="Eliminar tarefa"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TaskModal
          show={showModal}
          onClose={handleCloseModal}
          onTaskAdded={fetchTasks}
          editingTask={editingTask}
          isDuplicate={isDuplicate} // ✅ novo prop
        />

        <PresetsModal
          show={showPresets}
          onClose={() => setShowPresets(false)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
