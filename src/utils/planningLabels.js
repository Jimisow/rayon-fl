// Calcul automatique des étiquettes de créneau à partir des heures de début/fin.
// Un même créneau peut cumuler plusieurs étiquettes (ex: 7h-15h -> Matin + Après-midi),
// mais seulement si le chevauchement avec la période est significatif — sinon un créneau
// qui déborde de quelques minutes sur la période suivante (ex: 5h-12h30) se verrait
// injustement affubler d'une étiquette qui ne représente presque rien de son temps.

const PERIODES = [
  { label: "Matin", debut: 0, fin: 12 * 60 },
  { label: "Après-midi", debut: 12 * 60, fin: 19 * 60 },
  { label: "Fermeture", debut: 19 * 60, fin: 20 * 60 + 30 },
  { label: "Inventaire", debut: 20 * 60 + 30, fin: 24 * 60 },
];

// Une période compte si elle représente au moins 1h du créneau, ou au moins un quart
// de sa durée totale (utile pour les créneaux courts où 1h serait disproportionné).
const MIN_OVERLAP_MINUTES = 60;
const MIN_OVERLAP_RATIO = 0.25;

function toMinutes(heure) {
  const [h, m] = String(heure).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function computeLabels(heureDebut, heureFin) {
  const start = toMinutes(heureDebut);
  const end = toMinutes(heureFin);
  const duree = end - start;
  if (duree <= 0) return [];

  const labels = [];
  for (const periode of PERIODES) {
    const overlap = Math.min(end, periode.fin) - Math.max(start, periode.debut);
    if (overlap <= 0) continue;
    if (overlap >= MIN_OVERLAP_MINUTES || overlap / duree >= MIN_OVERLAP_RATIO) {
      labels.push(periode.label);
    }
  }

  return labels;
}
