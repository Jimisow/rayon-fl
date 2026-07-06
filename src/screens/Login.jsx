import { TEAM_MEMBERS } from "../constants";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-header">
        <span className="login-emoji">🍎🥦</span>
        <h1>Rayon Fruits &amp; Légumes</h1>
        <p>Qui es-tu ?</p>
      </div>
      <div className="login-list">
        {TEAM_MEMBERS.map((prenom) => (
          <button
            key={prenom}
            className="login-button"
            onClick={() => login(prenom)}
          >
            {prenom}
          </button>
        ))}
      </div>
    </div>
  );
}
