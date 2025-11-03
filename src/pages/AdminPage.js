import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./AdminPage.css";

function AdminPage() {
  const [selectedEntity, setSelectedEntity] = useState("users");
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false); // 👈 controla o modal

  const entities = [
    { key: "users", label: "Utilizadores" },
    { key: "clients", label: "Clientes" },
    { key: "contracts", label: "Contratos" },
    { key: "products", label: "Produtos" },
    { key: "activities", label: "Atividades" },
    { key: "partners", label: "Parceiros" },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedEntity]);

  const fetchData = async () => {
    try {
      setData([]);
      const res = await api.get(`/${selectedEntity}`);
      setData(res.data);
    } catch (err) {
      console.error(`Erro ao carregar ${selectedEntity}:`, err);
      setData([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/${selectedEntity}`, formData);
      setFormData({});
      setShowModal(false); // 👈 fecha modal após criar
      fetchData();
    } catch (err) {
      console.error(`Erro ao criar ${selectedEntity}:`, err);
    }
  };

  const handleEdit = (item) => {
    setEditId(item.id || item._id);
    setEditData(item);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/${selectedEntity}/${editId}`, editData);
      setEditId(null);
      setEditData({});
      fetchData();
    } catch (err) {
      console.error(`Erro ao editar ${selectedEntity}:`, err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem a certeza que deseja eliminar este registo?")) {
      try {
        await api.delete(`/${selectedEntity}/${id}`);
        fetchData();
      } catch (err) {
        console.error(`Erro ao eliminar ${selectedEntity}:`, err);
      }
    }
  };

  // === Form dinâmico ===
const renderForm = () => {
  switch (selectedEntity) {
    // --- USERS ---
    case "users":
      return (
        <>
          <input name="nome" placeholder="Nome" onChange={handleChange} />
          <input name="username" placeholder="Username" onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} />
          <input name="email" placeholder="Email" onChange={handleChange} />
          <input name="empresa_base" placeholder="Empresa Base" onChange={handleChange} />
          <input name="chave" placeholder="Chave" onChange={handleChange} />
          <select name="role" onChange={handleChange}>
            <option value="">Função</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </>
      );

    // --- CLIENTS ---
    case "clients":
      return (
        <>
          <input name="nome" placeholder="Nome" onChange={handleChange} />
          <input name="empresa" placeholder="Empresa" onChange={handleChange} />
          <input name="pais" placeholder="País" onChange={handleChange} />
          <input name="distancia_km" type="number" step="0.1" placeholder="Distância (km)" onChange={handleChange} />
          <input name="tempo_viagem" placeholder="Tempo Viagem (hh:mm)" onChange={handleChange} />
          <input name="latitude" type="number" step="0.000001" placeholder="Latitude" onChange={handleChange} />
          <input name="longitude" type="number" step="0.000001" placeholder="Longitude" onChange={handleChange} />
          <input name="localidade" placeholder="Localidade" onChange={handleChange} />
        </>
      );

    // --- CONTRACTS ---
    case "contracts":
      return (
        <>
          <input name="contrato" placeholder="Contrato" onChange={handleChange} />
          <input name="estado" placeholder="Estado" onChange={handleChange} />
          <input name="empresa" placeholder="Empresa" onChange={handleChange} />
          <input name="cliente" placeholder="Cliente" onChange={handleChange} />
          <input name="p_manager" placeholder="Project Manager" onChange={handleChange} />
          <input name="comercial" placeholder="Comercial" onChange={handleChange} />
          <input name="data_inicio" type="date" placeholder="Data Início" onChange={handleChange} />
          <input name="data_fim" type="date" placeholder="Data Fim" onChange={handleChange} />
          <input name="valor_d" type="number" step="0.01" placeholder="Valor ($)" onChange={handleChange} />
          <input name="valor_euro" type="number" step="0.01" placeholder="Valor (€)" onChange={handleChange} />
        </>
      );

    // --- PRODUCTS ---
    case "products":
      return (
        <>
          <input name="produto" placeholder="Produto" onChange={handleChange} />
          <input name="empresa" placeholder="Empresa" onChange={handleChange} />
        </>
      );

    // --- ACTIVITIES ---
    case "activities":
      return (
        <>
          <input name="atividade" placeholder="Atividade" onChange={handleChange} />
          <input name="custo_hora" type="number" step="0.01" placeholder="Custo Hora (€)" onChange={handleChange} />
        </>
      );

    // --- TASKS ---
    case "tasks":
      return (
        <>
          <input name="descricao" placeholder="Descrição" onChange={handleChange} />
          <input name="cliente" placeholder="Cliente" onChange={handleChange} />
          <input name="parceiro" placeholder="Parceiro" onChange={handleChange} />
          <input name="produto" placeholder="Produto" onChange={handleChange} />
          <input name="contrato" placeholder="Contrato" onChange={handleChange} />
          <input name="atividade" placeholder="Atividade" onChange={handleChange} />
          <input name="data" type="date" placeholder="Data" onChange={handleChange} />
          <input name="distancia_viagem" type="number" step="0.1" placeholder="Distância Viagem (km)" onChange={handleChange} />
          <input name="tempo_viagem" placeholder="Tempo Viagem (hh:mm)" onChange={handleChange} />
          <input name="tempo_atividade" placeholder="Tempo Atividade (hh:mm)" onChange={handleChange} />
          <input name="tempo_faturado" placeholder="Tempo Faturado (hh:mm)" onChange={handleChange} />
          <select name="faturavel" onChange={handleChange}>
            <option value="">Faturável?</option>
            <option value="Yes">Sim</option>
            <option value="No">Não</option>
          </select>
          <select name="viagem_faturavel" onChange={handleChange}>
            <option value="">Viagem Faturável?</option>
            <option value="Yes">Sim</option>
            <option value="No">Não</option>
          </select>
          <select name="local" onChange={handleChange}>
            <option value="">Local</option>
            <option value="Employee House">Employee House</option>
            <option value="Customer Office">Customer Office</option>
            <option value="Partner Office">Partner Office</option>
          </select>
          <input name="valor_euro" type="number" step="0.01" placeholder="Valor (€)" onChange={handleChange} />
        </>
      );

    // --- PARCEIROS ---
    case "partners":
      return (
        <>
          <input name="parceiro" placeholder="Parceiro" onChange={handleChange} />
          <input name="empresa" placeholder="Empresa" onChange={handleChange} />
          <input name="pais" placeholder="País" onChange={handleChange} />
          <input name="localidade" placeholder="Localidade" onChange={handleChange} />
          <input name="latitude" type="number" step="0.000001" placeholder="Latitude" onChange={handleChange} />
          <input name="longitude" type="number" step="0.000001" placeholder="Longitude" onChange={handleChange} />
        </>
      );

    // --- AGENDA ---
    case "agenda":
      return (
        <>
          <input name="utilizador" placeholder="Utilizador" onChange={handleChange} />
          <input name="data" type="date" placeholder="Data" onChange={handleChange} />
          <input name="hora_inicio" type="time" placeholder="Hora Início" onChange={handleChange} />
          <input name="hora_fim" type="time" placeholder="Hora Fim" onChange={handleChange} />
          <input name="descricao" placeholder="Descrição" onChange={handleChange} />
        </>
      );

    default:
      return <p>Selecione uma entidade para adicionar dados.</p>;
  }
};




  const getHeaders = () => {
    if (!data.length) return [];
    return Object.keys(data[0]).filter((key) => key !== "_id" && key !== "password");
  };

  return (
    <div className="admin-container">
      <h2>Painel de Administração</h2>

      <div className="entity-selector">
        {entities.map((e) => (
          <button
            key={e.key}
            onClick={() => setSelectedEntity(e.key)}
            className={selectedEntity === e.key ? "active" : ""}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* --- Botão para abrir modal --- */}
      <div className="create-button-container">
        <button className="btn-create" onClick={() => setShowModal(true)}>
          Adicionar
        </button>
      </div>

      {/* --- Modal de criação --- */}
      {showModal && (
        <div className="modal-overlay-admin">
          <div className="modal-admin">
            <h3>
              Criar {entities.find((e) => e.key === selectedEntity).label.slice(0, -1)}
            </h3>

            <form onSubmit={handleSubmit} className="modal-form">
              {renderForm()}

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Tabela --- */}
      <div className="data-table-container">
        {data.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                {getHeaders().map((header) => (
                  <th key={header}>{header.toUpperCase()}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id || item._id}>
                  {getHeaders().map((key) => (
                    <td key={key}>
                      {editId === (item.id || item._id) ? (
                        <input
                          name={key}
                          value={editData[key] || ""}
                          onChange={handleEditChange}
                        />
                      ) : (
                        String(item[key] || "")
                      )}
                    </td>
                  ))}
                  <td className="actions">
                    {editId === (item.id || item._id) ? (
                      <button className="save" onClick={handleSaveEdit}>
                        💾
                      </button>
                    ) : (
                      <>
                        <button className="edit" onClick={() => handleEdit(item)}>
                          ✏️
                        </button>
                        <button
                          className="delete"
                          onClick={() => handleDelete(item.id || item._id)}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Nenhum registo encontrado.</p>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
