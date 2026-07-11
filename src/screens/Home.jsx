import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, where, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { sameName, normalize } from "../utils/normalize";
import { computeLabels } from "../utils/planningLabels";
import { formatFullDate, formatDayLabel } from "../utils/formatDayLabel";
import { toISODate } from "../utils/planningDates";
import { messageOfTheDay } from "../utils/teamMessages";
import NoteCard from "../components/NoteCard";
import SharedRestockCard from "../components/SharedRestockCard";

export default function Home() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [todaysPlanning, setTodaysPlanning] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reapproItems, setReapproItems] = useState([]);
  const [partageListe, setPartageListe] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);

  const now = new Date();
  const todayISO = toISODate(now);

  useEffect(() => {
    const ref = doc(db, "planning", todayISO);
    const unsub = onSnapshot(ref, (snap) => {
      setTodaysPlanning(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [todayISO]);

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("date", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "productProposals"), where("statut", "==", "en_attente"));
    const unsub = onSnapshot(q, (snap) => setPendingCount(snap.size));
    return unsub;
  }, [isAdmin]);

  useEffect(() => {
    // Liste personnelle : chacun ne voit que ses propres articles à ramener.
    const q = query(collection(db, "reappro"), where("prenom", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => a.nom.localeCompare(b.nom));
      setReapproItems(items);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const ref = doc(db, "users", normalize(user));
    const unsub = onSnapshot(ref, (snap) => setPartageListe(!!snap.data()?.partageListe));
    return unsub;
  }, [user]);

  useEffect(() => {
    // Listes des autres membres qui ont choisi de partager la leur (dissociée de la sienne).
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const others = snap.docs.map((d) => d.data()).filter((u) => u.partageListe && !sameName(u.prenom, user));
      setSharedUsers(others);
    });
    return unsub;
  }, [user]);

  const todaysEntries = (todaysPlanning?.entrees || []).filter((e) => sameName(e.prenom, user));

  function marquerRamene(id) {
    deleteDoc(doc(db, "reappro", id));
  }

  function togglePartageListe() {
    updateDoc(doc(db, "users", normalize(user)), { partageListe: !partageListe });
  }

  return (
    <div className="screen home-screen">
      <h2>Bonjour {user} 👋</h2>
      <p className="home-date">{formatFullDate(now)}</p>

      <section className="card home-message">
        <p>{messageOfTheDay(now)}</p>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h3>Tes horaires</h3>
          <span className="card-date">{formatDayLabel(now)}</span>
        </div>
        {todaysEntries.length === 0 && <p className="empty-state">Aucun créneau aujourd'hui.</p>}
        {todaysEntries.map((entry, idx) => {
          const labels = computeLabels(entry.heureDebut, entry.heureFin);
          return (
            <div key={idx} className="today-slot">
              <span className="today-heures">
                {entry.heureDebut} - {entry.heureFin}
              </span>
              <div className="planning-badges">
                {labels.map((label) => (
                  <span key={label} className={`badge badge-${label}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {reapproItems.length > 0 && (
        <section className="card">
          <div className="card-header-row">
            <h3>À ramener de la chambre froide</h3>
            <button
              className={`card-icon-btn ${partageListe ? "card-icon-btn-active" : ""}`}
              onClick={togglePartageListe}
              title={partageListe ? "Liste partagée avec l'équipe" : "Partager ma liste"}
            >
              📤
            </button>
          </div>
          <div className="restock-checklist">
            {reapproItems.map((item) => (
              <label key={item.id} className="restock-row">
                <input type="checkbox" checked={false} onChange={() => marquerRamene(item.id)} />
                <span>{item.nom}</span>
              </label>
            ))}
          </div>
        </section>
      )}

      {sharedUsers.map((su) => (
        <SharedRestockCard key={su.prenom} prenom={su.prenom} />
      ))}

      {isAdmin && (
        <section className="card admin-summary">
          <h3>Propositions en attente</h3>
          <p className="pending-count">{pendingCount}</p>
        </section>
      )}

      <section className="card">
        <h3>Notes récentes</h3>
        {notes.length === 0 && <p className="empty-state">Aucune note pour le moment.</p>}
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </section>
    </div>
  );
}
