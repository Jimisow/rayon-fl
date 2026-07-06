// L'input HTML type="time" exige un format strict "HH:MM" zero-paddé, sinon il
// affiche un champ vide. Gemini renvoie parfois "5:30" au lieu de "05:30" :
// on normalise avant affichage pour ne pas perdre l'heure détectée.
export function normalizeHeure(value) {
  const match = String(value).trim().match(/^(\d{1,2})(?:[:h](\d{1,2}))?$/i);
  if (!match) return value;
  const h = match[1].padStart(2, "0");
  const m = (match[2] || "00").padStart(2, "0");
  return `${h}:${m}`;
}
