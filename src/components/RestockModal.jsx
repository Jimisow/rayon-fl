import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { normalize, slug } from "../utils/normalize";

const MAX_FREQUENTS = 7;

export default function RestockModal({ onClose }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [reapproIds, setReapproIds] = useState(new Set());
  const [usage, setUsage] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nom"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Liste personnelle : chacun ne voit et ne modifie que ses propres articles à ramener.
    const q = query(collection(db, "reappro"), where("prenom", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      setReapproIds(new Set(snap.docs.map((d) => d.data().productId)));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    // Historique perso : combien de fois chaque produit a été coché par cette personne.
    const q = query(collection(db, "reapproUsage"), where("prenom", "==", user));
    const unsub = onSnapshot(q, (snap) => {
      setUsage(snap.docs.map((d) => d.data()));
    });
    return unsub;
  }, [user]);

  const frequentProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return usage
      .slice()
      .sort((a, b) => b.count - a.count)
      .map((u) => byId.get(u.productId))
      .filter(Boolean)
      .slice(0, MAX_FREQUENTS);
  }, [usage, products]);

  const frequentIds = useMemo(() => new Set(frequentProducts.map((p) => p.id)), [frequentProducts]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = normalize(search);
    return products
      .filter((p) => !frequentIds.has(p.id))
      .filter((p) => normalize(p.nom).includes(term) || String(p.codeBarres).includes(search.trim()))
      .slice(0, 20);
  }, [products, search, frequentIds]);

  async function toggle(product) {
    const ref = doc(db, "reappro", `${slug(user)}_${product.id}`);
    if (reapproIds.has(product.id)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        prenom: user,
        productId: product.id,
        nom: product.nom,
        categorie: product.categorie,
        date: serverTimestamp(),
      });
      await setDoc(
        doc(db, "reapproUsage", `${slug(user)}_${product.id}`),
        {
          prenom: user,
          productId: product.id,
          nom: product.nom,
          categorie: product.categorie,
          count: increment(1),
        },
        { merge: true }
      );
    }
  }

  return (
    <div className="modal-overlay modal-overlay-center" onClick={onClose}>
      <div className="modal-card restock-modal" onClick={(e) => e.stopPropagation()}>
        <h3>À ramener de la chambre froide</h3>
        <p className="restock-hint">Coche ce qui manque au rayon.</p>

        <input
          className="search-input"
          type="text"
          placeholder="Chercher un autre produit à ajouter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {searchResults.length > 0 && (
          <div className="restock-checklist restock-search-results">
            {searchResults.map((p) => (
              <label key={p.id} className="restock-row">
                <input type="checkbox" checked={reapproIds.has(p.id)} onChange={() => toggle(p)} />
                <span>{p.nom}</span>
              </label>
            ))}
          </div>
        )}

        <p className="restock-section-label">Tes produits fréquents</p>
        <div className="restock-checklist">
          {frequentProducts.length === 0 && (
            <p className="empty-state">
              Coche des produits ci-dessus : ils apparaîtront ici la prochaine fois.
            </p>
          )}
          {frequentProducts.map((p) => (
            <label key={p.id} className="restock-row">
              <input type="checkbox" checked={reapproIds.has(p.id)} onChange={() => toggle(p)} />
              <span>{p.nom}</span>
            </label>
          ))}
        </div>

        <button className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
