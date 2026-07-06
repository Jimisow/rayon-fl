import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function AdminPanel({ onClose }) {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "productProposals"), where("statut", "==", "en_attente"));
    const unsub = onSnapshot(q, (snap) => {
      setProposals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function handleValider(proposal) {
    if (proposal.type === "ajout") {
      await addDoc(collection(db, "products"), proposal.data);
    } else if (proposal.type === "modif" && proposal.productId) {
      await updateDoc(doc(db, "products", proposal.productId), proposal.data);
    } else if (proposal.type === "suppression" && proposal.productId) {
      await deleteDoc(doc(db, "products", proposal.productId));
    }
    await updateDoc(doc(db, "productProposals", proposal.id), { statut: "validé" });
  }

  async function handleRejeter(proposal) {
    await updateDoc(doc(db, "productProposals", proposal.id), { statut: "rejeté" });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card admin-panel">
        <div className="admin-panel-header">
          <h3>Propositions en attente</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            Fermer
          </button>
        </div>

        {proposals.length === 0 && <p className="empty-state">Aucune proposition en attente.</p>}

        <div className="proposal-list">
          {proposals.map((p) => (
            <div key={p.id} className="proposal-row">
              <div className="proposal-info">
                <span className={`tag tag-${p.type}`}>{p.type}</span>
                <strong>{p.data?.nom}</strong>
                {p.data?.categorie && <span> · {p.data.categorie}</span>}
                {p.data?.codeBarres && <span> · {p.data.codeBarres}</span>}
                <div className="proposal-auteur">proposé par {p.auteur}</div>
              </div>
              <div className="proposal-actions">
                <button className="btn btn-primary" onClick={() => handleValider(p)}>
                  Valider
                </button>
                <button className="btn btn-danger" onClick={() => handleRejeter(p)}>
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
