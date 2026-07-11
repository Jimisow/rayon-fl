import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { sameName } from "../utils/normalize";
import { computeLabels } from "../utils/planningLabels";
import { formatFullDate, formatDayLabel } from "../utils/formatDayLabel";
import { toISODate } from "../utils/planningDates";
import { messageOfTheDay } from "../utils/teamMessages";
import NoteCard from "../components/NoteCard";
import RestockListCard from "../components/RestockListCard";
import RestockModal from "../components/RestockModal";

export default function Home() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [todaysPlanning, setTodaysPlanning] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [myLists, setMyLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);
  const [editingListId, setEditingListId] = useState(null);

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
    // Toutes les listes de réappro de la personne connectée.
    const q = query(collection(db, "reapproLists"), where("prenom", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      setMyLists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    // Listes des autres membres qui ont choisi de partager la leur (dissociées des siennes).
    const q = query(collection(db, "reapproLists"), where("partage", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const others = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((l) => !sameName(l.prenom, user));
      setSharedLists(others);
    });
    return unsub;
  }, [user]);

  const todaysEntries = (todaysPlanning?.entrees || []).filter((e) => sameName(e.prenom, user));

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

      {myLists.map((l) => (
        <RestockListCard key={l.id} list={l} isMine onEdit={() => setEditingListId(l.id)} />
      ))}

      {editingListId && (
        <RestockModal initialListId={editingListId} onClose={() => setEditingListId(null)} />
      )}

      {sharedLists.map((l) => (
        <RestockListCard key={l.id} list={l} isMine={false} />
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
