import { useEffect, useRef, useState } from "react";
import { collection, doc, query, where, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import ConfirmDialog from "./ConfirmDialog";

// Affiche une liste de réappro : la sienne (avec gestion : partage/modifier/supprimer)
// ou celle d'un collègue qui l'a partagée (dissociée de sa propre liste, préparable à distance).
export default function RestockListCard({ list, isMine, onEdit }) {
  const [items, setItems] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hadItemsRef = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "reappro"), where("listId", "==", list.id));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => a.nom.localeCompare(b.nom));
      setItems(arr);
    });
    return unsub;
  }, [list.id]);

  useEffect(() => {
    if (items.length > 0) hadItemsRef.current = true;
  }, [items.length]);

  useEffect(() => {
    // Une liste qu'on vient de vider (par soi-même ou via le partage) se supprime toute seule.
    // On ne supprime jamais une liste tout juste créée qui n'a encore jamais eu d'article.
    if (isMine && items.length === 0 && hadItemsRef.current) {
      deleteDoc(doc(db, "reapproLists", list.id));
    }
  }, [isMine, items.length, list.id]);

  if (items.length === 0) return null;

  function marquerRamene(id) {
    deleteDoc(doc(db, "reappro", id));
  }

  function togglePartage() {
    updateDoc(doc(db, "reapproLists", list.id), { partage: !list.partage });
  }

  async function handleDeleteList() {
    await Promise.all(items.map((it) => deleteDoc(doc(db, "reappro", it.id))));
    await deleteDoc(doc(db, "reapproLists", list.id));
    setConfirmDelete(false);
  }

  const title = isMine ? list.nom : `Liste de ${list.prenom} — ${list.nom}`;

  return (
    <section className="card">
      <div className="card-header-row">
        <h3>{title}</h3>

        {isMine && (
          <div className="note-manage-actions">
            <button
              className={`card-icon-btn ${list.partage ? "card-icon-btn-active" : ""}`}
              onClick={togglePartage}
              title={list.partage ? "Liste partagée avec l'équipe" : "Partager cette liste"}
            >
              📤
            </button>
            <button className="note-icon-btn" title="Modifier les produits de cette liste" onClick={onEdit}>
              ✏️
            </button>
            <button
              className="note-icon-btn note-icon-danger"
              title="Supprimer la liste"
              onClick={() => setConfirmDelete(true)}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="restock-checklist">
        {items.map((item) => (
          <label key={item.id} className="restock-row">
            <input type="checkbox" checked={false} onChange={() => marquerRamene(item.id)} />
            <span>{item.nom}</span>
          </label>
        ))}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer cette liste ?"
          message="Tous ses articles seront supprimés définitivement."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDeleteList}
        />
      )}
    </section>
  );
}
