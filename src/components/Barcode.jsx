import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

// Rendu fidèle en Code128 (accepte 6 à 13 caractères alphanumériques, sans checksum EAN).
export default function Barcode({ value, height = 80 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, String(value), {
        format: "CODE128",
        displayValue: true,
        height,
        margin: 8,
        font: "monospace",
      });
    } catch (err) {
      console.error("Erreur de génération du code-barres:", err);
    }
  }, [value, height]);

  if (!value) return null;

  return <svg ref={svgRef} className="barcode-svg" />;
}
