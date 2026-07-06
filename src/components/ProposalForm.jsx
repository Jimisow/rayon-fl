import { useState } from "react";
import { CATEGORIES, CATEGORIE_LABELS } from "../constants";

// Formulaire générique pour proposer un ajout ou une modification de produit.
export default function ProposalForm({ mode, product, onSubmit, onCancel }) {
  const [nom, setNom] = useState(product?.nom || "");
  const [categorie, setCategorie] = useState(product?.categorie || "fruit");
  const [codeBarres, setCodeBarres] = useState(product?.codeBarres || "");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const code = codeBarres.trim();
    if (!nom.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    if (code.length < 5 || code.length > 13) {
      setError("Le code doit contenir entre 5 et 13 caractères.");
      return;
    }
    onSubmit({ nom: nom.trim(), categorie, codeBarres: code });
  }

  return (
    <div className="modal-overlay">
      <form className="modal-card" onSubmit={handleSubmit}>
        <h3>{mode === "ajout" ? "Ajouter un produit" : "Proposer une modification"}</h3>

        <label>
          Nom du produit
          <input value={nom} onChange={(e) => setNom(e.target.value)} autoFocus />
        </label>

        <label>
          Catégorie
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIE_LABELS[cat]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Code (5 à 13 caractères)
          <input
            value={codeBarres}
            onChange={(e) => setCodeBarres(e.target.value)}
            maxLength={13}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            {mode === "ajout" ? "Ajouter" : "Envoyer la proposition"}
          </button>
        </div>
      </form>
    </div>
  );
}
