import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES, CATEGORIE_LABELS } from "../constants";
import { normalize } from "../utils/normalize";
import ProductRow from "../components/ProductRow";
import BarcodeModal from "../components/BarcodeModal";
import ProposalForm from "../components/ProposalForm";

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("toutes");
  const [openRowId, setOpenRowId] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [modifProduct, setModifProduct] = useState(null);
  const [supprimerProduct, setSupprimerProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nom"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categorie === "toutes" || p.categorie === categorie;
      const matchSearch =
        !search.trim() ||
        normalize(p.nom).includes(normalize(search)) ||
        String(p.codeBarres).includes(search.trim());
      return matchCat && matchSearch;
    });
  }, [products, search, categorie]);

  async function submitProposal(type, data, productId) {
    await addDoc(collection(db, "productProposals"), {
      type,
      productId: productId || null,
      data,
      auteur: user,
      statut: "en_attente",
      date: serverTimestamp(),
    });
  }

  return (
    <div className="screen products-screen">
      <h2>Produits</h2>

      <input
        className="search-input"
        type="text"
        placeholder="Rechercher un produit ou un code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="category-filters">
        <button
          className={`chip ${categorie === "toutes" ? "chip-active" : ""}`}
          onClick={() => setCategorie("toutes")}
        >
          Toutes
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip chip-${cat} ${categorie === cat ? "chip-active" : ""}`}
            onClick={() => setCategorie(cat)}
          >
            {CATEGORIE_LABELS[cat]}
          </button>
        ))}
      </div>

      <button className="btn btn-primary add-btn" onClick={() => setShowAddForm(true)}>
        + Ajouter un produit
      </button>

      <div className="product-list">
        {filtered.length === 0 && <p className="empty-state">Aucun produit trouvé.</p>}
        {filtered.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            isOpen={openRowId === p.id}
            onOpenChange={(open) => setOpenRowId(open ? p.id : null)}
            onView={() => setViewingProduct(p)}
            onModifier={() => setModifProduct(p)}
            onSupprimer={() => setSupprimerProduct(p)}
          />
        ))}
      </div>

      {viewingProduct && (
        <BarcodeModal product={viewingProduct} onClose={() => setViewingProduct(null)} />
      )}

      {showAddForm && (
        <ProposalForm
          mode="ajout"
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (data) => {
            await submitProposal("ajout", data, null);
            setShowAddForm(false);
          }}
        />
      )}

      {modifProduct && (
        <ProposalForm
          mode="modif"
          product={modifProduct}
          onCancel={() => setModifProduct(null)}
          onSubmit={async (data) => {
            await submitProposal("modif", data, modifProduct.id);
            setModifProduct(null);
          }}
        />
      )}

      {supprimerProduct && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirmer la suppression ?</h3>
            <p>
              Une proposition de suppression de « {supprimerProduct.nom} » sera envoyée pour
              validation par un admin.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSupprimerProduct(null)}>
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  await submitProposal("suppression", { nom: supprimerProduct.nom }, supprimerProduct.id);
                  setSupprimerProduct(null);
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
