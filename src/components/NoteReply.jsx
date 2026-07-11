import { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../context/AdminContext";
import { sameName } from "../utils/normalize";
import { formatDate } from "../utils/formatDate";
import ConfirmDialog from "./ConfirmDialog";

export default function NoteReply({ reply }) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(reply.contenu);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isMine = sameName(reply.auteur, user);
  const canDelete = isMine || isAdmin;

  async function saveEdit() {
    if (!text.trim()) return;
    await updateDoc(doc(db, "noteReplies", reply.id), { contenu: text.trim(), modifie: true });
    setEditing(false);
  }

  async function handleDelete() {
    await deleteDoc(doc(db, "noteReplies", reply.id));
    setConfirmDelete(false);
  }

  return (
    <div className="note-reply">
      <div className="note-header">
        <strong>{reply.auteur}</strong>
        <span className="note-date">{formatDate(reply.date)}</span>
      </div>

      {editing ? (
        <div className="note-edit-form">
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <div className="note-edit-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditing(false);
                setText(reply.contenu);
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
          {reply.contenu}
          {reply.modifie && <span className="note-edited-tag"> (modifié)</span>}
        </p>
      )}

      {!editing && (isMine || canDelete) && (
        <div className="note-actions note-actions-end">
          <div className="note-manage-actions">
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

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cette réponse ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
