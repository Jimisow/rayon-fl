import { useRef, useState } from "react";

const ACTION_WIDTH = 160;

// Ligne produit avec actions Modifier/Supprimer révélées en glissant vers la gauche.
export default function ProductRow({ product, isOpen, onOpenChange, onView, onModifier, onSupprimer }) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  const baseOffset = isOpen ? -ACTION_WIDTH : 0;
  const offset = dragging.current ? dragX : baseOffset;

  function handlePointerDown(e) {
    startX.current = e.clientX;
    dragging.current = true;
    moved.current = false;
    setDragX(baseOffset);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 4) moved.current = true;
    const next = Math.max(-ACTION_WIDTH, Math.min(0, baseOffset + delta));
    setDragX(next);
  }

  function handlePointerUp() {
    if (!dragging.current) return;
    dragging.current = false;

    if (!moved.current) {
      if (isOpen) {
        onOpenChange(false);
      } else {
        onView();
      }
      return;
    }

    onOpenChange(dragX < -ACTION_WIDTH / 2);
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
      >
        <span className={`dot dot-${product.categorie}`} />
        <span className="product-nom">{product.nom}</span>
        <span className="product-code">{product.codeBarres}</span>
      </div>
    </div>
  );
}
