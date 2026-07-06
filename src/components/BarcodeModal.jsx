import Barcode from "./Barcode";
import { CATEGORIE_LABELS } from "../constants";

export default function BarcodeModal({ product, onClose }) {
  return (
    <div className="modal-overlay modal-overlay-center" onClick={onClose}>
      <div className="modal-card barcode-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{product.nom}</h3>
        <p className="product-meta">{CATEGORIE_LABELS[product.categorie]}</p>

        <div className="barcode-wrapper">
          <Barcode value={product.codeBarres} height={100} />
        </div>

        <button className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
