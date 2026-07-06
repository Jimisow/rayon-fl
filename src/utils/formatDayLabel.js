import { JOUR_PAR_INDEX } from "../constants";

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function jourNameForDate(date) {
  return JOUR_PAR_INDEX[date.getDay()];
}

// Ex: "Lundi 6 juillet"
export function formatDayLabel(date) {
  const jour = capitalize(jourNameForDate(date));
  const reste = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `${jour} ${reste}`;
}

// Ex: "Lundi 6 juillet 2026"
export function formatFullDate(date) {
  const jour = capitalize(jourNameForDate(date));
  const reste = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `${jour} ${reste}`;
}
