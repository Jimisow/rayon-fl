// Calcul automatique des étiquettes de créneau à partir des heures de début/fin.
// Un même créneau peut cumuler plusieurs étiquettes (ex: 7h-15h -> Matin + Après-midi).

const PERIODES = [
  { label: "Matin", debut: 0, fin: 12 * 60 },
  { label: "Après-midi", debut: 12 * 60, fin: 19 * 60 },
  { label: "Fermeture", debut: 19 * 60, fin: 20 * 60 + 30 },
  { label: "Inventaire", debut: 20 * 60 + 30, fin: 24 * 60 },
];

// Une période compte si son chevauchement avec le créneau est significatif — significatif étant
// rapporté à la plus petite des deux durées (celle du créneau ou celle de la période elle-même).
// Ça évite qu'un simple débordement de quelques minutes compte (ex: 11h-19h touchant à peine le
// "Matin"), tout en laissant "Fermeture"/"Inventaire" s'appliquer à un long créneau qui les
// traverse entièrement même si ça ne représente qu'une petite fraction de sa durée totale.
const MIN_OVERLAP_RATIO = 0.4;

function toMinutes(heure) {
  const [h, m] = String(heure).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function computeLabels(heureDebut, heureFin) {
  const start = toMinutes(heureDebut);
  const end = toMinutes(heureFin);
  const duree = end - start;
  if (duree <= 0) return [];

  let labels = [];
  for (const periode of PERIODES) {
    const overlap = Math.min(end, periode.fin) - Math.max(start, periode.debut);
    if (overlap <= 0) continue;
    const reference = Math.min(duree, periode.fin - periode.debut);
    if (overlap / reference >= MIN_OVERLAP_RATIO) {
      labels.push(periode.label);
    }
  }

  // Un créneau qui se termine après 19h est avant tout un créneau de fermeture : on ne le
  // qualifie plus aussi d'"Après-midi", même s'il a passé une bonne partie de la journée dans
  // cette tranche horaire.
  if (end > 19 * 60) {
    labels = labels.filter((l) => l !== "Après-midi");
  }

  return labels;
}
