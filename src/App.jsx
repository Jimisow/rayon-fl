import { useEffect, useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import { seedUsers, seedProducts, seedSamplePlanning, cleanupOldPlanning } from "./utils/seed";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Products from "./screens/Products";
import Planning from "./screens/Planning";
import Notes from "./screens/Notes";
import ProfileMenu from "./components/ProfileMenu";
import RestockButton from "./components/RestockButton";

const TABS = [
  { id: "accueil", label: "Accueil", emoji: "🏠" },
  { id: "produits", label: "Produits", emoji: "🍅" },
  { id: "planning", label: "Planning", emoji: "🗓️" },
  { id: "notes", label: "Notes", emoji: "📝" },
];

function MainApp() {
  const { user } = useAuth();
  const [tab, setTab] = useState("accueil");

  useEffect(() => {
    seedUsers().catch((err) => console.warn("Seed users échoué (hors-ligne ?):", err));
    seedProducts().catch((err) => console.warn("Seed produits échoué (hors-ligne ?):", err));
    seedSamplePlanning().catch((err) => console.warn("Seed planning échoué (hors-ligne ?):", err));
    cleanupOldPlanning().catch((err) => console.warn("Nettoyage planning échoué (hors-ligne ?):", err));
  }, []);

  if (!user) return <Login />;

  return (
    <div className="app-shell">
      <ProfileMenu />
      <RestockButton />

      <main className="app-content">
        {tab === "accueil" && <Home />}
        {tab === "produits" && <Products />}
        {tab === "planning" && <Planning />}
        {tab === "notes" && <Notes />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-emoji">{t.emoji}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <MainApp />
      </AdminProvider>
    </AuthProvider>
  );
}
