import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import AdminPanel from "./AdminPanel";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { isAdmin, unlock, lock } = useAdmin();
  const [open, setOpen] = useState(false);
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const initiale = user ? user.charAt(0).toUpperCase() : "?";

  function handleCodeSubmit(e) {
    e.preventDefault();
    if (unlock(code)) {
      setShowCodeForm(false);
      setCode("");
      setError("");
      setShowPanel(true);
    } else {
      setError("Code incorrect.");
    }
  }

  return (
    <>
      <button className="profile-btn" onClick={() => setOpen((o) => !o)} title={user}>
        {initiale}
      </button>

      {open && (
        <>
          <div className="profile-overlay" onClick={() => setOpen(false)} />
          <div className="profile-menu">
            <div className="profile-menu-user">{user}</div>

            <button
              className="profile-menu-item"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              Changer d'utilisateur
            </button>

            {isAdmin ? (
              <>
                <button
                  className="profile-menu-item"
                  onClick={() => {
                    setOpen(false);
                    setShowPanel(true);
                  }}
                >
                  Propositions en attente
                </button>
                <button
                  className="profile-menu-item profile-menu-subtle"
                  onClick={() => {
                    lock();
                    setOpen(false);
                  }}
                >
                  🔒 Verrouiller l'espace admin
                </button>
              </>
            ) : (
              <button
                className="profile-menu-item profile-menu-subtle"
                onClick={() => {
                  setOpen(false);
                  setShowCodeForm(true);
                }}
              >
                🔒 Espace admin
              </button>
            )}
          </div>
        </>
      )}

      {showCodeForm && (
        <div className="modal-overlay">
          <form className="modal-card" onSubmit={handleCodeSubmit}>
            <h3>Code admin</h3>
            <input
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              placeholder="••••"
            />
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowCodeForm(false);
                  setCode("");
                  setError("");
                }}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Déverrouiller
              </button>
            </div>
          </form>
        </div>
      )}

      {showPanel && <AdminPanel onClose={() => setShowPanel(false)} />}
    </>
  );
}
