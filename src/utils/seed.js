import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { TEAM_MEMBERS } from "../constants";
import { normalize } from "./normalize";
import { toISODate, mondayOfWeek } from "./planningDates";

// Préremplit la collection `users` avec les 5 comptes de l'équipe (idempotent).
export async function seedUsers() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  const existing = new Set(snapshot.docs.map((d) => normalize(d.data().prenom)));

  const missing = TEAM_MEMBERS.filter((prenom) => !existing.has(normalize(prenom)));
  await Promise.all(
    missing.map((prenom) => setDoc(doc(db, "users", normalize(prenom)), { prenom }))
  );
}

const CATEGORIE_MAP = {
  Fruits: "fruit",
  Légumes: "legume",
  Autres: "autre",
};

// Catalogue réel du rayon (nom, code, catégorie brute telle que fournie par l'équipe).
const RAW_PRODUCTS = [
  { nom: "Abricot", code: "200375000000", cat: "Fruits" },
  { nom: "Ail blanc vrac France cal60/80", code: "207693000000", cat: "Légumes" },
  { nom: "Ail chinois", code: "92421", cat: "Légumes" },
  { nom: "Ail irac", code: "200485000000", cat: "Fruits" },
  { nom: "Ananas", code: "92356", cat: "Fruits" },
  { nom: "Artichauts", code: "92460", cat: "Légumes" },
  { nom: "Aubergine Reunion", code: "200478000000", cat: "Légumes" },
  { nom: "Avocat", code: "92358", cat: "Fruits" },
  { nom: "Banane Reunion", code: "200359000000", cat: "Fruits" },
  { nom: "Basilic", code: "90350", cat: "Autres" },
  { nom: "Betterave rouge Reunion", code: "200457000000", cat: "Légumes" },
  { nom: "Bibasse Reunion", code: "200361000000", cat: "Fruits" },
  { nom: "Brede Chou", code: "92489", cat: "Légumes" },
  { nom: "Brede Chou chine", code: "92412", cat: "Légumes" },
  { nom: "Brede Chouchou", code: "92414", cat: "Légumes" },
  { nom: "Brede Citrouille", code: "92417", cat: "Légumes" },
  { nom: "Brede Cresson", code: "92404", cat: "Légumes" },
  { nom: "Brede lastron", code: "92487", cat: "Légumes" },
  { nom: "Brede mafane", code: "92416", cat: "Légumes" },
  { nom: "Brede morel", code: "92413", cat: "Légumes" },
  { nom: "Brede moutarde", code: "92428", cat: "Légumes" },
  { nom: "Brede Pariataire", code: "92419", cat: "Légumes" },
  { nom: "Brede Patate", code: "92415", cat: "Légumes" },
  { nom: "Brocolis", code: "204090000000", cat: "Légumes" },
  { nom: "Caimbite", code: "205044000000", cat: "Fruits" },
  { nom: "Carambole", code: "205044000000", cat: "Fruits" },
  { nom: "Carotte Import", code: "200465000000", cat: "Légumes" },
  { nom: "Carotte Reunion", code: "200484000000", cat: "Légumes" },
  { nom: "Carotte sachet Sevetiaye", code: "205700000000", cat: "Légumes" },
  { nom: "Cèleri", code: "92461", cat: "Autres" },
  { nom: "Celeri branche", code: "200353000000", cat: "Autres" },
  { nom: "Celeri rave", code: "204587000000", cat: "Autres" },
  { nom: "Cerise", code: "205249000000", cat: "Fruits" },
  { nom: "Champignon Paris entier", code: "200492000000", cat: "Légumes" },
  { nom: "Champignon Shiitake", code: "205047000000", cat: "Légumes" },
  { nom: "Champignon Trompette mort", code: "208692000000", cat: "Légumes" },
  { nom: "Chou fleur", code: "92463", cat: "Légumes" },
  { nom: "Chou rouge Reunion au kg", code: "200400000000", cat: "Légumes" },
  { nom: "Chou vert", code: "92462", cat: "Légumes" },
  { nom: "Chouchou Reunion", code: "200470000000", cat: "Légumes" },
  { nom: "Citron Caviar", code: "204758000000", cat: "Fruits" },
  { nom: "Citron jaune", code: "200300000000", cat: "Fruits" },
  { nom: "Citron jaune pei", code: "200360000000", cat: "Fruits" },
  { nom: "Citron vert pei", code: "206923000000", cat: "Fruits" },
  { nom: "Citrouille", code: "200446000000", cat: "Légumes" },
  { nom: "Coco", code: "92350", cat: "Fruits" },
  { nom: "Coeur Boeuf", code: "200498000000", cat: "Légumes" },
  { nom: "Coing vrac au kg France cat 1", code: "200464000000", cat: "Fruits" },
  { nom: "Combaura Reunion x2", code: "205019000000", cat: "Légumes" },
  { nom: "Concombre", code: "92450", cat: "Légumes" },
  { nom: "Coton mili", code: "92422", cat: "Légumes" },
  { nom: "Courge Butternut au kg Reunion", code: "200405000000", cat: "Légumes" },
  { nom: "Courgette", code: "200445000000", cat: "Légumes" },
  { nom: "Courgette jaune Reunion au kg", code: "200460000000", cat: "Légumes" },
  { nom: "Courgette ronde verte ou jaune", code: "205045000000", cat: "Légumes" },
  { nom: "Curcuma", code: "207081000000", cat: "Autres" },
  { nom: "Datte Medjoul Vrac", code: "205635000000", cat: "Fruits" },
  { nom: "Endive kg", code: "200480000000", cat: "Légumes" },
  { nom: "Fenouil", code: "200436000000", cat: "Légumes" },
  { nom: "Figue de barbarie vrac Italie", code: "206492000000", cat: "Fruits" },
  { nom: "Figue noire fraiche", code: "200463000000", cat: "Fruits" },
  { nom: "Fruit passion Reunion", code: "200380000000", cat: "Fruits" },
  { nom: "Gingembre bot Sevetiaye", code: "205726000000", cat: "Autres" },
  { nom: "Grenade earl/red Israel cat1", code: "200461000000", cat: "Fruits" },
  { nom: "Gros Piment", code: "200427000000", cat: "Légumes" },
  { nom: "Gros Piment bot Sevetiaye", code: "205706000000", cat: "Légumes" },
  { nom: "Haricot beurre Reunion", code: "205340000000", cat: "Légumes" },
  { nom: "Haricot jaune", code: "200438000000", cat: "Légumes" },
  { nom: "Haricot vert vrac Reunion", code: "200442000000", cat: "Légumes" },
  { nom: "Haricots vert bot Sevetiaye", code: "205707000000", cat: "Légumes" },
  { nom: "Jujube Reunion", code: "200421000000", cat: "Fruits" },
  { nom: "Jus d'orange presse 1L", code: "207225000000", cat: "Autres" },
  { nom: "Jus de mandarine presse 50cl", code: "207224000000", cat: "Autres" },
  { nom: "Jus orange presse 50cl", code: "200416000000", cat: "Autres" },
  { nom: "Kaki vrac", code: "200370000000", cat: "Fruits" },
  { nom: "Kumquat", code: "200356000000", cat: "Autres" },
  { nom: "L'huile", code: "12345", cat: "Autres" },
  { nom: "Letchi kg", code: "204537000000", cat: "Fruits" },
  { nom: "Longani vrac orig Reunion", code: "204697000000", cat: "Fruits" },
  { nom: "Mais bot Sevetiaye", code: "205730000000", cat: "Légumes" },
  { nom: "Mandarine", code: "200467000000", cat: "Fruits" },
  { nom: "Mandarine Reunion Zanzbar", code: "205014000000", cat: "Fruits" },
  { nom: "Mange tout Reunion", code: "200440000000", cat: "Légumes" },
  { nom: "Mangoustan kg", code: "205390000000", cat: "Fruits" },
  { nom: "Mangue Jose", code: "200398000000", cat: "Fruits" },
  { nom: "Mangue rouge", code: "200407000000", cat: "Fruits" },
  { nom: "Manioc Reunion", code: "205028000000", cat: "Légumes" },
  { nom: "Margoze Reunion", code: "200454000000", cat: "Légumes" },
  { nom: "Melon canari", code: "207323000000", cat: "Fruits" },
  { nom: "Melon cantaloup", code: "200363000000", cat: "Fruits" },
  { nom: "Menthe", code: "92429", cat: "Autres" },
  { nom: "Mini concombre croque sanjhy", code: "200783000000", cat: "Légumes" },
  { nom: "Navet Reunion", code: "200459000000", cat: "Légumes" },
  { nom: "Nectarine", code: "200376000000", cat: "Fruits" },
  { nom: "Noisette fraiche vrac", code: "200409000000", cat: "Autres" },
  { nom: "Noix vrac", code: "202928000000", cat: "Fruits" },
  { nom: "Oignon jaune", code: "200491000000", cat: "Légumes" },
  { nom: "Oignon rouge", code: "200175000000", cat: "Légumes" },
  { nom: "Oignon vert", code: "92407", cat: "Légumes" },
  { nom: "Orange import vrac variete valencia", code: "200395000000", cat: "Fruits" },
  { nom: "Orange Reunion", code: "200388000000", cat: "Fruits" },
  { nom: "Papaye Reunion", code: "200364000000", cat: "Fruits" },
  { nom: "Pasteque Reunion", code: "205030000000", cat: "Fruits" },
  { nom: "Patate douce Reunion", code: "200472000000", cat: "Légumes" },
  { nom: "Patisson", code: "200411000000", cat: "Légumes" },
  { nom: "Peche jaune vrac cat1", code: "200390000000", cat: "Fruits" },
  { nom: "Peche plat chair blanche", code: "204870000000", cat: "Fruits" },
  { nom: "Pepino Reunion", code: "200425000000", cat: "Fruits" },
  { nom: "Persil", code: "92425", cat: "Autres" },
  { nom: "Persil frise", code: "90351", cat: "Autres" },
  { nom: "Petit piment bot Sevetiaye", code: "205715000000", cat: "Légumes" },
  { nom: "Petit piment Reunion", code: "200402000000", cat: "Légumes" },
  { nom: "Petit pois rond Reunion", code: "200455000000", cat: "Légumes" },
  { nom: "Petite tomate allongee", code: "200374000000", cat: "Légumes" },
  { nom: "Petite tomate serre bot Seveti", code: "205725000000", cat: "Légumes" },
  { nom: "Piment cabris", code: "207747000000", cat: "Autres" },
  { nom: "Pistache verte vrac", code: "204375000000", cat: "Autres" },
  { nom: "Pitaya Reunion", code: "200415000000", cat: "Fruits" },
  { nom: "Poire", code: "200516000000", cat: "Fruits" },
  { nom: "Poire Williams", code: "201021000000", cat: "Fruits" },
  { nom: "Poireau vrac Reunion", code: "200450000000", cat: "Légumes" },
  { nom: "Poivron couleur rouge jaune", code: "200355000000", cat: "Légumes" },
  { nom: "Poivron jaune/orange", code: "200354000000", cat: "Légumes" },
  { nom: "Poivron vert", code: "200447000000", cat: "Légumes" },
  { nom: "Poivrons vert bot Sevetiaye", code: "205750000000", cat: "Légumes" },
  { nom: "Pomelo rose", code: "200392000000", cat: "Fruits" },
  { nom: "Pomelos pays", code: "200672000000", cat: "Fruits" },
  { nom: "Pomme de terre blanche", code: "200422000000", cat: "Légumes" },
  { nom: "Pomme de terre rose", code: "200410000000", cat: "Légumes" },
  { nom: "Pomme fuji", code: "205023000000", cat: "Fruits" },
  { nom: "Pomme golden", code: "200352000000", cat: "Fruits" },
  { nom: "Pomme granny", code: "200384000000", cat: "Fruits" },
  { nom: "Pomme k (issable)", code: "208707000000", cat: "Fruits" },
  { nom: "Pomme pink lady", code: "200357000000", cat: "Fruits" },
  { nom: "Pomme Top Red", code: "200385000000", cat: "Fruits" },
  { nom: "Pomme royal gala", code: "200420000000", cat: "Fruits" },
  { nom: "Pomme ruby", code: "207573000000", cat: "Fruits" },
  { nom: "Pomme story vrac", code: "206240000000", cat: "Fruits" },
  { nom: "Prune jaune", code: "200424000000", cat: "Fruits" },
  { nom: "Prune reunion vrac", code: "206556000000", cat: "Fruits" },
  { nom: "Prune rouge", code: "200366000000", cat: "Fruits" },
  { nom: "Radis blanc", code: "207941000000", cat: "Légumes" },
  { nom: "Radis botte", code: "92456", cat: "Légumes" },
  { nom: "Radis noir", code: "204150000000", cat: "Légumes" },
  { nom: "Raisin blanc", code: "200382000000", cat: "Fruits" },
  { nom: "Raisin noir", code: "200381000000", cat: "Fruits" },
  { nom: "Raisin rose", code: "200358000000", cat: "Fruits" },
  { nom: "Salade", code: "92401", cat: "Légumes" },
  { nom: "Sapotille", code: "207677000000", cat: "Fruits" },
  { nom: "Songe pei", code: "205051000000", cat: "Légumes" },
  { nom: "Thym", code: "92424", cat: "Autres" },
  { nom: "Tomate ananas litee", code: "205224000000", cat: "Légumes" },
  { nom: "Tomate arbuste", code: "205051000000", cat: "Légumes" },
  { nom: "Tomate coeur de boeuf", code: "205004000000", cat: "Légumes" },
  { nom: "Tomate grosse grappe", code: "200435000000", cat: "Légumes" },
  { nom: "Tomate noire de crimee litee F", code: "201765000000", cat: "Légumes" },
  { nom: "Tomate ronde zebree verte", code: "206663000000", cat: "Légumes" },
  { nom: "Topinambour vrac France", code: "205450000000", cat: "Autres" },
  { nom: "Romarin", code: "92472", cat: "Autres" },
];

function slugify(nom) {
  return normalize(nom).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Importe le catalogue réel du rayon (upsert par nom : ré-exécutable sans doublons).
export async function seedProducts() {
  const productsRef = collection(db, "products");
  await Promise.all(
    RAW_PRODUCTS.map((p) =>
      setDoc(doc(productsRef, slugify(p.nom)), {
        nom: p.nom,
        categorie: CATEGORIE_MAP[p.cat] || "autre",
        codeBarres: p.code,
      })
    )
  );
}

// Un doc par date (YYYY-MM-DD). Permet un import photo qui écrase les dates déjà
// renseignées et ajoute simplement les nouvelles, sans jamais tout remplacer.
function isoOffset(baseDate, offsetDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return toISODate(d);
}

// Ajoute un planning d'exemple (calé sur aujourd'hui) si aucun planning n'existe encore.
export async function seedSamplePlanning() {
  const planningRef = collection(db, "planning");
  const snapshot = await getDocs(planningRef);
  if (!snapshot.empty) return;

  const today = new Date();
  const days = {
    [isoOffset(today, 0)]: [
      { prenom: "Jimi", heureDebut: "07:00", heureFin: "15:00" },
      { prenom: "Cécile", heureDebut: "14:00", heureFin: "21:00" },
    ],
    [isoOffset(today, 1)]: [
      { prenom: "Christophe", heureDebut: "09:00", heureFin: "17:00" },
      { prenom: "Said", heureDebut: "08:00", heureFin: "12:00" },
    ],
    [isoOffset(today, 2)]: [{ prenom: "Jeanlin", heureDebut: "06:00", heureFin: "13:00" }],
    [isoOffset(today, 3)]: [
      { prenom: "Jimi", heureDebut: "13:00", heureFin: "20:00" },
      { prenom: "Christophe", heureDebut: "15:00", heureFin: "19:00" },
    ],
    [isoOffset(today, 4)]: [
      { prenom: "Said", heureDebut: "12:00", heureFin: "19:00" },
      { prenom: "Cécile", heureDebut: "10:00", heureFin: "14:00" },
    ],
  };

  await Promise.all(
    Object.entries(days).map(([date, entrees]) => setDoc(doc(planningRef, date), { date, entrees }))
  );
}

// Supprime les plannings des semaines déjà entièrement passées (nettoyage hebdomadaire).
export async function cleanupOldPlanning() {
  const mondayISO = toISODate(mondayOfWeek(new Date()));
  const planningRef = collection(db, "planning");
  const q = query(planningRef, where("date", "<", mondayISO));
  const snapshot = await getDocs(q);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}
