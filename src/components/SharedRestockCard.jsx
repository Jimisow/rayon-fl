import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Liste de réappro d'un autre membre de l'équipe (partagée par lui), pour permettre
// de la préparer à distance. Dissociée de "sa" propre liste personnelle.
export default function SharedRestockCard({ prenom }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "reappro"), where("prenom", "==", prenom));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.nom.localeCompare(b.nom));
      setItems(list);
    });
    return unsub;
  }, [prenom]);

  if (items.length === 0) return null;

  function marquerRamene(id) {
    deleteDoc(doc(db, "reappro", id));
  }

  return (
    <section className="card">
      <h3>Liste de {prenom}</h3>
      <div className="restock-checklist">
        {items.map((item) => (
          <label key={item.id} className="restock-row">
            <input type="checkbox" checked={false} onChange={() => marquerRamene(item.id)} />
            <span>{item.nom}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
