import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    async function getToken() {
      const response = await api.get(`/auth/entra/entra-callback?code=${code}`)


      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    }

    getToken();
  }, []);

  return <p>A autenticar...</p>;
}

export default AuthCallback;
