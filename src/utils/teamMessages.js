const MESSAGES = [
  "Belle journée à toute l'équipe, prenez soin de vous ! 🍉",
  "Merci pour le travail sur le rayon, ça se voit ! 🥬",
  "Pensez à vérifier les produits abîmés avant la mise en rayon 🍓",
  "Petite pensée pour l'équipe du jour, bon courage ! 💪",
  "Un rayon bien tenu, une équipe au top ! 🍊",
  "N'hésitez pas à laisser une note si besoin d'un coup de main 📝",
  "Bonne semaine à tous, restons soudés ! 🥕",
  "Merci de vérifier les étiquettes après chaque réassort 🏷️",
];

// Message stable sur toute la journée, change chaque jour.
export function messageOfTheDay(date = new Date()) {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 86400000
  );
  return MESSAGES[dayOfYear % MESSAGES.length];
}
