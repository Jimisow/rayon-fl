// Normalise une heure tapée librement ("7", "7h", "7h30", "7:30"...) vers le format
// canonique "HH:MM" zero-paddé utilisé partout ailleurs dans l'app.
export function normalizeHeure(value) {
  const match = String(value).trim().match(/^(\d{1,2})(?:[:h](\d{1,2})?)?$/i);
  if (!match) return value;
  const h = match[1].padStart(2, "0");
  const m = (match[2] || "00").padStart(2, "0");
  return `${h}:${m}`;
}
