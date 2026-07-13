import { sameName } from "./normalize";
import { computeLabels } from "./planningLabels";

// Regroupe les créneaux d'un même jour par personne : une coupure (ex: 7h-11h puis 12h-15h)
// doit apparaître comme une seule entrée avec ses deux segments, pas deux lignes distinctes.
export function groupEntriesByPerson(entries) {
  const groups = [];
  for (const entry of entries) {
    const existing = groups.find((g) => sameName(g.prenom, entry.prenom));
    if (existing) {
      existing.segments.push(entry);
    } else {
      groups.push({ prenom: entry.prenom, segments: [entry] });
    }
  }
  groups.forEach((g) => g.segments.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)));
  return groups;
}

// Union des étiquettes de tous les segments d'une même journée pour une personne.
export function computeGroupLabels(segments) {
  const labels = new Set();
  segments.forEach((seg) => computeLabels(seg.heureDebut, seg.heureFin).forEach((l) => labels.add(l)));
  return Array.from(labels);
}
