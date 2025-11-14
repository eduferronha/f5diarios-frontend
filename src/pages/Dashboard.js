import React, { useState, useEffect } from "react";
import api from "../services/api";
import TaskModal from "../components/TaskModel";
import CalendarDashboard from "../components/CalendarDashboard";
import PresetsModal from "../components/PresetsModal";
import "./DashboardTable.css";
import { Edit3, Copy, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import toast, { Toaster } from "react-hot-toast";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const [showPresets, setShowPresets] = useState(false);
  const [presetToApply, setPresetToApply] = useState(null);

  const token = localStorage.getItem("token");
  const [presetsAtivos, setPresetsAtivos] = useState([]);

  const [preselectedDate, setPreselectedDate] = useState(null);

  const handleAddTaskFromCalendar = (date) => {
    setPreselectedDate(date);
    setEditingTask(null);
    setShowModal(true);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.", { duration: 8000 });
      } else {
        toast.error("Erro ao carregar tarefas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPresetsAtivos = async () => {
    try {
      const res = await api.get("/presets/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ativos = res.data.filter((p) => p.ativo);
      setPresetsAtivos(ativos);
    } catch (err) {
      console.error("Erro ao carregar presets ativos:", err);
      toast.error("Erro ao carregar presets ativos.");
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchPresetsAtivos();
  }, []);

  useEffect(() => {
    if (!showPresets) fetchPresetsAtivos();
  }, [showPresets]);

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
    const result = await Swal.fire({
      title: "Tens a certeza?",
      text: "Esta tarefa será eliminada permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#237c9b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, eliminar",
      cancelButtonText: "Cancelar",
      backdrop: true,
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Tarefa eliminada com sucesso!");
      fetchTasks();
    } catch (error) {
      console.error("Erro ao eliminar tarefa:", error);
      toast.error("Erro ao eliminar tarefa.");
    }
  };

  const handleEdit = (task) => {
    setPresetToApply(null);
    setEditingTask(task);
    setIsDuplicate(false);
    setShowModal(true);
  };

  const handleDuplicate = (task) => {
    const duplicatedTask = { ...task };
    delete duplicatedTask.id;
    delete duplicatedTask._id;

    setPresetToApply(null);
    setEditingTask(duplicatedTask);
    setIsDuplicate(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setPresetToApply(null);
    setShowModal(false);
    setIsDuplicate(false);
  };

  const handleApplyPreset = (preset) => {
    setPresetToApply(preset);
    setEditingTask(null);
    setIsDuplicate(false);
    setShowModal(true);
  };

  return (
    <div className="dashboard-layout">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="dashboard-calendar">
        <CalendarDashboard tasks={tasks} onAddTask={handleAddTaskFromCalendar} />
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

          <div className="dashboard-buttons">
            <button
              className="btn-presets-db"
              onClick={() => setShowPresets(true)}
            >
              Presets
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

        {presetsAtivos.length > 0 && (
          <div className="presets-ativos-bar">
            {presetsAtivos.map((preset) => (
              <button
                key={preset.id}
                className="btn-preset"
                onClick={() => handleApplyPreset(preset)}
              >
                ⚡ {preset.nome || "Preset sem nome"}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="loading">A carregar tarefas...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="no-tasks">Sem tarefas neste mês.</p>
        ) : (
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>Local</th>
                  <th>Cliente</th>
                  <th>Parceiro</th>
                  <th>Produto</th>
                  <th>Atividade</th>
                  <th>Tempo Atividade</th>
                  <th>Tempo Faturado</th>
                  <th>Viagem Faturável</th>
                  <th>Valor (€)</th>
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
                        className="btn-icon"
                        onClick={() => handleEdit(task)}
                        title="Editar tarefa"
                      >
                        <Edit3 size={18} color="#237c9b" />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDuplicate(task)}
                        title="Duplicar tarefa"
                      >
                        <Copy size={18} color="#237c9b" />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(task.id)}
                        title="Eliminar tarefa"
                      >
                        <Trash2 size={18} color="#237c9b" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TaskModal
          key={isDuplicate ? `duplicate-${editingTask?.id || "new"}` : "normal"}
          show={showModal}
          onClose={handleCloseModal}
          onTaskAdded={fetchTasks}
          editingTask={editingTask}
          isDuplicate={isDuplicate}
          isPresetMode={!!presetToApply}
          presetData={presetToApply}
          preselectedDate={preselectedDate}
        />

        <PresetsModal
          show={showPresets}
          onClose={() => setShowPresets(false)}
          onApplyPreset={(preset) => {
            setPresetToApply(preset);
            setShowPresets(false);
            setShowModal(true);
          }}
        />
      </div>
    </div>
  );
}

export default Dashboard;
