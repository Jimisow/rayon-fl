import { useRef, useState } from "react";

const ACTION_WIDTH = 160;
const TAP_SLOP = 10;

// Ligne produit avec actions Modifier/Supprimer révélées en glissant vers la gauche.
export default function ProductRow({ product, isOpen, onOpenChange, onView, onModifier, onSupprimer }) {
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  const scrolling = useRef(false);

  const baseOffset = isOpen ? -ACTION_WIDTH : 0;
  const offset = dragging.current ? dragX : baseOffset;

  function handlePointerDown(e) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragging.current = true;
    moved.current = false;
    scrolling.current = false;
    setDragX(baseOffset);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging.current || scrolling.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (!moved.current) {
      // Défilement vertical de la liste : on laisse faire, ce n'est ni un tap ni un swipe.
      if (Math.abs(deltaY) > TAP_SLOP && Math.abs(deltaY) > Math.abs(deltaX)) {
        scrolling.current = true;
        return;
      }
      // Micro-mouvement (tremblement du doigt) : on ne bascule pas encore en mode swipe.
      if (Math.abs(deltaX) <= TAP_SLOP) return;
      moved.current = true;
    }

    const next = Math.max(-ACTION_WIDTH, Math.min(0, baseOffset + deltaX));
    setDragX(next);
  }

  function handlePointerUp() {
    if (!dragging.current) return;
    dragging.current = false;

    if (scrolling.current) {
      scrolling.current = false;
      return;
    }

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
