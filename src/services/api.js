import axios from "axios";

const api = axios.create({
  // baseURL: "http://127.0.0.1:8000", 
  baseURL: process.env.REACT_APP_API_URL,
    // baseURL: import.meta.env.VITE_API_URL,

});

// 🔐 Interceptor — adiciona o token JWT a todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
