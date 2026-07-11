import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import NoteCard from "../components/NoteCard";

export default function Notes() {
  const { user } = useAuth();
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
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </div>
  );
}
