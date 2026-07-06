import { TEAM_MEMBERS } from "../constants";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    semaine: {
      type: "STRING",
      description: "Identifiant de la semaine tel qu'indiqué sur le planning (ex: '2026-S28' ou '06/07 au 12/07').",
    },
    entrees: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          prenom: { type: "STRING" },
          jour: { type: "STRING" },
          heureDebut: { type: "STRING", description: "Format HH:MM 24h" },
          heureFin: { type: "STRING", description: "Format HH:MM 24h" },
        },
        required: ["prenom", "jour", "heureDebut", "heureFin"],
      },
    },
  },
  required: ["semaine", "entrees"],
};

function buildPrompt() {
  const noms = TEAM_MEMBERS.join(", ");
  return `Tu analyses une photo de planning papier d'un magasin.
Le planning contient des créneaux de travail pour plusieurs personnes, mais SEULE une partie de l'équipe (rayon fruits et légumes) nous intéresse.

Ne garde QUE les lignes correspondant aux prénoms suivants (ignore tout le reste, y compris les autres employés d'un autre service qui apparaissent sur la même photo) : ${noms}.

Règles strictes :
- Si un nom de famille apparaît à côté du prénom, ne garde que le prénom.
- Ignore complètement toute ligne dont le prénom ne correspond à aucun des prénoms listés ci-dessus (comparaison insensible aux accents et à la casse).
- Pour chaque créneau conservé, extrait : le prénom, le jour de la semaine (ex: "Lundi"), l'heure de début et l'heure de fin au format HH:MM (24h).
- Si une personne a plusieurs créneaux dans la semaine (plusieurs jours), retourne une entrée par créneau.
- Important : relis la photo ligne par ligne pour CHACUN des ${TEAM_MEMBERS.length} prénoms ci-dessus et vérifie qu'aucun créneau n'a été oublié, y compris si l'écriture est peu lisible (fais une transcription au mieux plutôt que d'omettre la ligne).
- N'arrête pas la liste avant d'avoir parcouru tous les jours de la semaine pour toutes les personnes concernées.
- Réponds uniquement avec les données structurées demandées, sans texte conversationnel.`;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function extractPlanningFromImage(file) {
  if (!API_KEY) {
    throw new Error("Clé API Gemini manquante (VITE_GEMINI_API_KEY).");
  }

  const base64Data = await fileToBase64(file);

  const body = {
    contents: [
      {
        parts: [
          { text: buildPrompt() },
          {
            inlineData: {
              mimeType: file.type || "image/jpeg",
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 8192,
      // Désactive le budget de "réflexion" interne pour ne pas rogner le budget de sortie JSON.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erreur Gemini (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Réponse Gemini vide ou inattendue.");
  }

  return JSON.parse(text);
}
