import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../f5tci_logo_small.png";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setRole(parsedUser.role);
    }
  }, []);

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Agenda", path: "/agenda" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/dashboard")}>
        <img src={logo} alt="F5TCI Logo" className="navbar-logo-img" />
        <span>F5 Diários</span>
      </div>

      <ul className="navbar-links">
        {navItems.map((item) => (
          <li
            key={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.name}
          </li>
        ))}

        {/* Dropdown de análises */}
        <li
          className={`nav-item dropdown ${
            location.pathname.startsWith("/analises") ? "active" : ""
          }`}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <span>Análises ▾</span>
          {showDropdown && (
            <ul className="dropdown-menu">
              <li onClick={() => navigate("/analises/relatorios")}>
                Relatórios
              </li>
            </ul>
          )}
        </li>

        {/* Aba visível apenas para administradores */}
        {role === "admin" && (
          <>
            <li
              className={`nav-item ${
                location.pathname === "/atividade" ? "active" : ""
              }`}
              onClick={() => navigate("/atividade")}
            >
              Atividade
            </li>
            <li
              className={`nav-item ${
                location.pathname === "/projetos" ? "active" : ""
              }`}
              onClick={() => navigate("/projetos")}
            >
              Projetos
            </li>

            <li
              className={`nav-item ${
                location.pathname === "/admin" ? "active" : ""
              }`}
              onClick={() => navigate("/admin")}
            >
              Admin
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
