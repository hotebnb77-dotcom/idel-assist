// Données de démonstration 100 % FICTIVES.
// Prénoms, adresses, identifiants et cabinets sont inventés.
// Les dates sont calculées par rapport au jour courant pour que la démo soit toujours « vivante ».
import { addDays } from "./dates";
import type { AppState, Cabinet, Patient, Remplacement, Tache, Transmission, Visite } from "./types";

export const STATE_VERSION = 1;

const cabinets: Cabinet[] = [
  {
    id: "cab-oliviers",
    nom: "Cabinet des Oliviers",
    ville: "Nice",
    adresse: "12 rue Imaginaire, 06000 Nice (fictif)",
    couleur: "bleu",
    tauxRetrocession: 85,
    honorairesJourMoyen: 420,
    kmTrajet: 18,
  },
  {
    id: "cab-port",
    nom: "Cabinet du Port",
    ville: "Antibes",
    adresse: "3 quai des Exemples, 06600 Antibes (fictif)",
    couleur: "vert",
    tauxRetrocession: 80,
    honorairesJourMoyen: 380,
    kmTrajet: 32,
  },
  {
    id: "cab-mimosas",
    nom: "Cabinet Les Mimosas",
    ville: "Cannes",
    adresse: "8 avenue Fictive, 06400 Cannes (fictif)",
    couleur: "ambre",
    tauxRetrocession: 82,
    honorairesJourMoyen: 400,
    kmTrajet: 45,
  },
];

type PatientSeed = [prenom: string, adresse: string, soins: string[], horaire: string, notes: string];

const seeds: Record<string, { code: string; patients: PatientSeed[] }> = {
  "cab-oliviers": {
    code: "OLI",
    patients: [
      ["Albertine", "4 impasse des Démos, Nice", ["Prise de sang"], "07:30", "À jeun. Code portail fictif 1234."],
      ["Marcel", "22 avenue Exemple, Nice", ["Injection sous-cutanée", "Surveillance glycémie"], "08:00", "Sonner deux fois."],
      ["Josette", "9 rue du Test, Nice", ["Pansement simple"], "08:45", "Clé chez la voisine (fictif)."],
      ["Lucien", "15 boulevard Fictif, Nice", ["Aide à la prise du traitement"], "09:30", "Chien calme dans le jardin."],
      ["Paulette", "2 place de la Maquette, Nice", ["Bas de contention"], "10:15", ""],
      ["Gaston", "31 chemin des Essais, Nice", ["Surveillance glycémie"], "18:30", "Passage du soir."],
    ],
  },
  "cab-port": {
    code: "POR",
    patients: [
      ["Yvette", "5 rue des Voiles (fictive), Antibes", ["Pansement simple"], "07:45", "Interphone : nom fictif DUPONT-DEMO."],
      ["René", "18 avenue du Phare (fictive), Antibes", ["Injection sous-cutanée"], "08:30", ""],
      ["Simone", "7 traverse Exemple, Antibes", ["Prise de sang"], "09:00", "Ordonnance à récupérer au cabinet."],
      ["Fernand", "40 route Imaginaire, Antibes", ["Aide à la prise du traitement", "Bas de contention"], "11:00", ""],
    ],
  },
  "cab-mimosas": {
    code: "MIM",
    patients: [
      ["Odette", "11 allée des Mimosas (fictive), Cannes", ["Surveillance glycémie"], "07:15", ""],
      ["Raymond", "6 rue Démo, Cannes", ["Pansement simple"], "08:15", "Parking possible devant."],
      ["Ginette", "27 boulevard Test, Cannes", ["Bas de contention"], "09:15", ""],
    ],
  },
};

function construirePatients(): Patient[] {
  const patients: Patient[] = [];
  for (const [cabinetId, { code, patients: liste }] of Object.entries(seeds)) {
    liste.forEach(([prenom, adresse, soins, horaire, notes], i) => {
      patients.push({
        id: `pat-${code.toLowerCase()}-${i + 1}`,
        cabinetId,
        prenom,
        identifiant: `DEMO-${code}-${String(i + 1).padStart(3, "0")}`,
        adresse,
        soins,
        horaire,
        notes,
        actif: true,
      });
    });
  }
  return patients;
}

function construireRemplacements(today: string): Remplacement[] {
  const r: Remplacement[] = [];
  let n = 0;
  const add = (cabinetId: string, offset: number, debut: string, fin: string, statut: Remplacement["statut"], kmTournee: number) =>
    r.push({ id: `rem-${++n}`, cabinetId, date: addDays(today, offset), debut, fin, statut, kmTournee });

  // Journées passées (effectuées)
  add("cab-oliviers", -9, "07:00", "13:00", "effectue", 24);
  add("cab-port", -8, "07:00", "12:30", "effectue", 30);
  add("cab-oliviers", -6, "07:00", "13:00", "effectue", 22);
  add("cab-mimosas", -5, "07:00", "12:00", "effectue", 19);
  add("cab-oliviers", -3, "07:00", "13:00", "effectue", 26);
  add("cab-port", -2, "07:00", "12:30", "effectue", 28);
  add("cab-oliviers", -1, "07:00", "19:00", "effectue", 35);
  // Aujourd'hui et à venir
  add("cab-oliviers", 0, "07:00", "19:00", "prevu", 25);
  add("cab-port", 1, "07:00", "12:30", "prevu", 28);
  add("cab-oliviers", 2, "07:00", "13:00", "prevu", 24);
  // Conflit volontaire : deux cabinets le même matin
  add("cab-mimosas", 5, "07:00", "12:00", "prevu", 20);
  add("cab-port", 5, "08:00", "13:00", "prevu", 28);
  add("cab-oliviers", 7, "07:00", "13:00", "prevu", 24);
  // Conflit volontaire : remplacement un jour d'indisponibilité
  add("cab-port", 9, "07:00", "12:30", "prevu", 28);
  add("cab-mimosas", 12, "07:00", "12:00", "prevu", 20);
  return r;
}

function construireVisites(today: string, patients: Patient[]): Visite[] {
  const visites: Visite[] = [];
  for (const cabinetId of ["cab-oliviers", "cab-port"]) {
    patients
      .filter((p) => p.cabinetId === cabinetId)
      .sort((a, b) => a.horaire.localeCompare(b.horaire))
      .forEach((p, i) => {
        visites.push({
          id: `vis-${p.id}-${today}`,
          cabinetId,
          patientId: p.id,
          date: today,
          heure: p.horaire,
          ordre: i + 1,
          soins: [...p.soins],
          soinsCoches: [],
          statut: "a_faire",
        });
      });
  }
  return visites;
}

function construireTransmissions(today: string): Transmission[] {
  const t = (offsetJours: number, heure: string) => `${addDays(today, offsetJours)}T${heure}:00`;
  return [
    {
      id: "tr-1",
      cabinetId: "cab-oliviers",
      patientId: "pat-oli-3",
      creeLe: t(-1, "18:40"),
      auteur: "Collègue titulaire (fictive)",
      source: "ecrite",
      texte: "Exemple fictif : la clé est désormais chez la voisine du 2e étage. Prévoir 5 minutes de plus pour le passage.",
      simulation: false,
      statut: "validee",
      lu: false,
      prioritaire: true,
      valideeLe: t(-1, "18:41"),
    },
    {
      id: "tr-2",
      cabinetId: "cab-oliviers",
      creeLe: t(-1, "12:10"),
      auteur: "Secrétariat (fictif)",
      source: "ecrite",
      texte: "Exemple fictif : réunion de cabinet décalée à jeudi 13h. Merci de confirmer votre présence.",
      simulation: false,
      statut: "validee",
      lu: false,
      prioritaire: false,
      valideeLe: t(-1, "12:11"),
    },
    {
      id: "tr-3",
      cabinetId: "cab-oliviers",
      patientId: "pat-oli-2",
      creeLe: t(-2, "19:05"),
      auteur: "Vous (démo)",
      source: "audio",
      nomFichierAudio: "memo-vocal-exemple.m4a",
      texte:
        "[SIMULATION] Texte d'exemple généré localement sur le téléphone. Il ne provient PAS de votre fichier audio et ne contient aucune observation clinique.\nÀ compléter par vous après écoute :\n- Points d'organisation pour la collègue : …",
      simulation: true,
      statut: "a_valider",
      lu: true,
      prioritaire: false,
    },
    {
      id: "tr-4",
      cabinetId: "cab-port",
      creeLe: t(-1, "17:30"),
      auteur: "Collègue titulaire (fictif)",
      source: "ecrite",
      texte: "Exemple fictif : le parking du quai est fermé demain, se garer rue des Voiles.",
      simulation: false,
      statut: "validee",
      lu: false,
      prioritaire: false,
      valideeLe: t(-1, "17:31"),
    },
  ];
}

function construireTaches(today: string): Tache[] {
  return [
    { id: "ta-1", titre: "Récupérer les ordonnances au cabinet (démo)", cabinetId: "cab-oliviers", importante: true, faite: false, echeance: today },
    { id: "ta-2", titre: "Envoyer le relevé de rétrocession du mois (démo)", importante: true, faite: false, echeance: addDays(today, 3) },
    { id: "ta-3", titre: "Recharger la trousse de pansements (démo)", importante: false, faite: false },
    { id: "ta-4", titre: "Confirmer le remplacement de la semaine prochaine (démo)", cabinetId: "cab-port", importante: true, faite: false, echeance: addDays(today, 1) },
  ];
}

export function creerEtatDemo(today: string): AppState {
  const patients = construirePatients();
  return {
    version: STATE_VERSION,
    creeLe: today,
    cabinetSelectionneId: "cab-oliviers",
    cabinets: cabinets.map((c) => ({ ...c })),
    patients,
    remplacements: construireRemplacements(today),
    indisponibilites: [addDays(today, 9), addDays(today, 10)],
    visites: construireVisites(today, patients),
    transmissions: construireTransmissions(today),
    taches: construireTaches(today),
    parametres: { prixKm: 0.6, prenomUtilisatrice: "Camille" },
  };
}
