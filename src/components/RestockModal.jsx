import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  setDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { normalize, slug } from "../utils/normalize";

const MAX_FREQUENTS = 7;

export default function RestockModal({ onClose, initialListId }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
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
    const q = query(collection(db, "reapproLists"), where("prenom", "==", user));
    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        // Première utilisation : on crée une liste par défaut.
        await addDoc(collection(db, "reapproLists"), {
          prenom: user,
          nom: "Liste 1",
          partage: false,
          createdAt: serverTimestamp(),
        });
        return;
      }
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setLists(arr);
      setActiveListId((current) => {
        if (current && arr.some((l) => l.id === current)) return current;
        if (initialListId && arr.some((l) => l.id === initialListId)) return initialListId;
        return arr[0].id;
      });
    });
    return unsub;
  }, [user, initialListId]);

  useEffect(() => {
    if (!activeListId) return;
    // Liste personnelle : chacun ne voit et ne modifie que ses propres articles à ramener.
    const q = query(
      collection(db, "reappro"),
      where("prenom", "==", user),
      where("listId", "==", activeListId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setReapproIds(new Set(snap.docs.map((d) => d.data().productId)));
    });
    return unsub;
  }, [user, activeListId]);

  useEffect(() => {
    // Historique perso : combien de fois chaque produit a été coché par cette personne,
    // tous ses listes confondues.
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

  const usageCountById = useMemo(() => {
    const map = new Map();
    usage.forEach((u) => map.set(u.productId, u.count));
    return map;
  }, [usage]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = normalize(search);
    return products
      .filter((p) => normalize(p.nom).includes(term) || String(p.codeBarres).includes(search.trim()))
      .sort((a, b) => (usageCountById.get(b.id) || 0) - (usageCountById.get(a.id) || 0))
      .slice(0, 20);
  }, [products, search, usageCountById]);

  async function toggle(product) {
    const ref = doc(db, "reappro", `${slug(user)}_${activeListId}_${product.id}`);
    if (reapproIds.has(product.id)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, {
        prenom: user,
        listId: activeListId,
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

  async function addList() {
    const ref = await addDoc(collection(db, "reapproLists"), {
      prenom: user,
      nom: `Liste ${lists.length + 1}`,
      partage: false,
      createdAt: serverTimestamp(),
    });
    setActiveListId(ref.id);
  }

  return (
    <div className="modal-overlay modal-overlay-center" onClick={onClose}>
      <div className="modal-card restock-modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-header-row">
          <h3>À ramener de la chambre froide</h3>
          <button className="note-icon-btn" title="Ajouter une liste" onClick={addList}>
            ➕
          </button>
        </div>

        {lists.length > 1 && (
          <div className="list-tabs">
            {lists.map((l) => (
              <button
                key={l.id}
                className={`list-tab ${l.id === activeListId ? "list-tab-active" : ""}`}
                onClick={() => setActiveListId(l.id)}
              >
                {l.nom}
              </button>
            ))}
          </div>
        )}

        <p className="restock-hint">Coche ce qui manque au rayon.</p>

        <input
          className="search-input"
          type="text"
          placeholder="Chercher un autre produit à ajouter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search.trim() ? (
          <div className="restock-checklist restock-search-results">
            {searchResults.length === 0 && <p className="empty-state">Aucun résultat.</p>}
            {searchResults.map((p) => (
              <label key={p.id} className="restock-row">
                <input type="checkbox" checked={reapproIds.has(p.id)} onChange={() => toggle(p)} />
                <span>{p.nom}</span>
              </label>
            ))}
          </div>
        ) : (
          <>
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
          </>
        )}

        <button className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
