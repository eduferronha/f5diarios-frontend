import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (!code) {
      navigate("/login");
      return;
    }

    async function finishLogin() {
      try {
        const response = await api.get(`/auth/entra/entra-callback?code=${code}`);

        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        navigate("/dashboard");
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    }

    finishLogin();
  }, [navigate]);

  return <p>A autenticar com a Microsoft...</p>;
}

export default AuthCallback;
