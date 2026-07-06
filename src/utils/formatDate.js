// Formatte un Timestamp Firestore (ou une valeur en attente de resync offline) en date lisible.
export function formatDate(timestamp) {
  if (!timestamp) return "à l'instant";
  const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return dateObj.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
