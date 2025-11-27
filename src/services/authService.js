import api from "./api";

export async function refreshToken() {
  try {
    const response = await api.post("/auth/refresh");
    localStorage.setItem("token", response.data.access_token);
  } catch (err) {
    console.error("Erro a refrescar token", err);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}
