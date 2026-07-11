// Comparaison insensible à la casse et aux accents (ex: "cecile" === "Cécile").
export function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function sameName(a, b) {
  return normalize(a) === normalize(b);
}

// Identifiant Firestore-safe (sans accents/espaces) à partir d'un texte libre.
export function slug(str) {
  return normalize(str).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
