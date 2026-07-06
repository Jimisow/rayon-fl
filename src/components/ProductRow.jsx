import { useRef, useState } from "react";

const ACTION_WIDTH = 160;
const SWIPE_SLOP = 10;

// Ligne produit avec actions Modifier/Supprimer révélées en glissant vers la gauche.
// Le tap (ouverture de la modal) passe par le onClick natif du navigateur, qui gère déjà
// correctement la distinction tap/scroll — on ne capture le pointeur que si un vrai
// glissement horizontal est confirmé, pour ne jamais interférer avec le défilement vertical.
export default function ProductRow({ product, isOpen, onOpenChange, onView, onModifier, onSupprimer }) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  const baseOffset = isOpen ? -ACTION_WIDTH : 0;
  const offset = dragging.current && moved.current ? dragX : baseOffset;

  function handlePointerDown(e) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragging.current = true;
    moved.current = false;
    setDragX(baseOffset);
  }

  function handlePointerMove(e) {
    if (!dragging.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (!moved.current) {
      // Mouvement trop faible, ou plutôt vertical (défilement de la liste) : on laisse le
      // navigateur gérer nativement, on ne touche à rien.
      if (Math.abs(deltaX) <= SWIPE_SLOP || Math.abs(deltaY) > Math.abs(deltaX)) return;
      moved.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const next = Math.max(-ACTION_WIDTH, Math.min(0, baseOffset + deltaX));
    setDragX(next);
  }

  function handlePointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (moved.current) {
      onOpenChange(dragX < -ACTION_WIDTH / 2);
    }
  }

  function handleClick() {
    // Un swipe qui vient de se terminer ne doit pas aussi déclencher l'ouverture de la modal.
    if (moved.current) return;
    if (isOpen) {
      onOpenChange(false);
    } else {
      onView();
    }
  }

  return (
    <div className="swipe-row">
      <div className="swipe-actions">
        <button
          className="swipe-btn swipe-modif"
          onClick={() => {
            onOpenChange(false);
            onModifier();
          }}
        >
          Modifier
        </button>
        <button
          className="swipe-btn swipe-suppr"
          onClick={() => {
            onOpenChange(false);
            onSupprimer();
          }}
        >
          Supprimer
        </button>
      </div>
      <div
        className="swipe-content product-row"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        <span className={`dot dot-${product.categorie}`} />
        <span className="product-nom">{product.nom}</span>
        <span className="product-code">{product.codeBarres}</span>
      </div>
    </div>
  );
}
