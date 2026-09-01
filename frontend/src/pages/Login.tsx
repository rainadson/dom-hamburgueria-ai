import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import "../styles/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      await authService.login(email, password);

      navigate("/dashboard");
    } catch (error) {
      alert("Email ou senha inválidos.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay" />

      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-brand">
          <div className="brand-icon">🍔</div>

          <h1>Dom AI</h1>

          <p>Dom Hamburgueria</p>
        </div>

        <div className="login-form">
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Senha</label>

          <input
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <small className="login-footer">
          Desenvolvido por AOS Tecnologia
        </small>
      </form>
    </div>
  );
}