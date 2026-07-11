import { useEffect, useState } from "react";
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { sameName } from "../utils/normalize";
import { formatDate } from "../utils/formatDate";
import NoteReply from "./NoteReply";
import ConfirmDialog from "./ConfirmDialog";

export default function NoteCard({ note }) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(note.contenu);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "noteReplies"), where("noteId", "==", note.id));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0));
      setReplies(items);
    });
    return unsub;
  }, [note.id]);

  const likedBy = note.likedBy || [];
  const iLiked = likedBy.some((p) => sameName(p, user));
  const isMine = sameName(note.auteur, user);
  const canDelete = isMine || isAdmin;

  async function toggleLike() {
    const ref = doc(db, "notes", note.id);
    if (iLiked) {
      await updateDoc(ref, { likedBy: arrayRemove(user) });
    } else {
      await updateDoc(ref, { likedBy: arrayUnion(user) });
    }
  }

  async function saveEdit() {
    if (!editText.trim()) return;
    await updateDoc(doc(db, "notes", note.id), { contenu: editText.trim(), modifie: true });
    setEditing(false);
  }

  async function handleDeleteNote() {
    await deleteDoc(doc(db, "notes", note.id));
    setConfirmDelete(false);
  }

  async function handleReplySubmit(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addDoc(collection(db, "noteReplies"), {
      noteId: note.id,
      auteur: user,
      contenu: replyText.trim(),
      date: serverTimestamp(),
    });
    setReplyText("");
  }

  return (
    <div className="note-card">
      <div className="note-header">
        <strong>{note.auteur}</strong>
        <span className="note-date">{formatDate(note.date)}</span>
      </div>

      {editing ? (
        <div className="note-edit-form">
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} autoFocus />
          <div className="note-edit-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditing(false);
                setEditText(note.contenu);
              }}
            >
              Annuler
            </button>
            <button className="btn btn-primary" onClick={saveEdit}>
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <p>
          {note.contenu}
          {note.modifie && <span className="note-edited-tag"> (modifié)</span>}
        </p>
      )}

      {!editing && (
        <div className="note-actions">
          <div className="note-reactions">
            <button className={`note-reaction ${iLiked ? "note-reaction-active" : ""}`} onClick={toggleLike}>
              👍 {likedBy.length}
            </button>
          </div>
          <div className="note-manage-actions">
            <button
              className="note-icon-btn"
              title={showReplies ? "Masquer les réponses" : "Répondre"}
              onClick={() => setShowReplies((s) => !s)}
            >
              💬
              {replies.length > 0 && <span className="note-icon-count">{replies.length}</span>}
            </button>
            {isMine && (
              <button className="note-icon-btn" title="Modifier" onClick={() => setEditing(true)}>
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                className="note-icon-btn note-icon-danger"
                title="Supprimer"
                onClick={() => setConfirmDelete(true)}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}

      {showReplies && (
        <div className="note-replies">
          {replies.map((r) => (
            <NoteReply key={r.id} reply={r} />
          ))}
          <form className="note-reply-form" onSubmit={handleReplySubmit}>
            <input
              type="text"
              placeholder="Répondre..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Envoyer
            </button>
          </form>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cette note ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDeleteNote}
        />
      )}
    </div>
  );
}
