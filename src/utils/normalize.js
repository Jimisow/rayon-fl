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
