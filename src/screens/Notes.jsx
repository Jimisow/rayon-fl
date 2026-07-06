import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { sameName } from "../utils/normalize";
import { formatDate } from "../utils/formatDate";

export default function Notes() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [notes, setNotes] = useState([]);
  const [contenu, setContenu] = useState("");

  useEffect(() => {
    const q = query(collection(db, "notes"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!contenu.trim()) return;
    await addDoc(collection(db, "notes"), {
      auteur: user,
      contenu: contenu.trim(),
      date: serverTimestamp(),
    });
    setContenu("");
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "notes", id));
  }

  return (
    <div className="screen notes-screen">
      <h2>Notes</h2>

      <form className="note-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Écrire une note pour l'équipe..."
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          rows={3}
        />
        <button type="submit" className="btn btn-primary">
          Publier
        </button>
      </form>

      <div className="note-list">
        {notes.length === 0 && <p className="empty-state">Aucune note pour le moment.</p>}
        {notes.map((n) => {
          const canDelete = sameName(n.auteur, user) || isAdmin;
          return (
            <div key={n.id} className="note-card">
              <div className="note-header">
                <strong>{n.auteur}</strong>
                <span className="note-date">{formatDate(n.date)}</span>
              </div>
              <p>{n.contenu}</p>
              {canDelete && (
                <button className="note-delete-btn" onClick={() => handleDelete(n.id)}>
                  Supprimer
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
