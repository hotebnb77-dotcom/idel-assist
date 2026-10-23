// Modèle de données de la démonstration.
// IMPORTANT : toutes les données sont fictives. Aucune donnée patient réelle.

export type ISODate = string; // "2026-10-23"
export type HeureHHMM = string; // "08:15"

export interface Cabinet {
  id: string;
  nom: string;
  ville: string;
  adresse: string;
  couleur: CouleurCabinet;
  /** Part des honoraires reversée à la remplaçante (en %). */
  tauxRetrocession: number;
  /** Honoraires fictifs moyens générés par journée (en €). */
  honorairesJourMoyen: number;
  /** Kilomètres aller-retour domicile ↔ cabinet. */
  kmTrajet: number;
}

export type CouleurCabinet = "bleu" | "vert" | "ambre" | "violet" | "rose";

export interface Patient {
  id: string;
  cabinetId: string;
  prenom: string;
  /** Identifiant fictif, ex. DEMO-OLI-001 */
  identifiant: string;
  adresse: string;
  soins: string[];
  horaire: HeureHHMM;
  notes: string;
  actif: boolean;
}

export type StatutRemplacement = "prevu" | "effectue" | "annule";

export interface Remplacement {
  id: string;
  cabinetId: string;
  date: ISODate;
  debut: HeureHHMM;
  fin: HeureHHMM;
  statut: StatutRemplacement;
  /** Kilomètres parcourus pendant la tournée (fictifs). */
  kmTournee: number;
}

export type StatutVisite = "a_faire" | "en_cours" | "realisee" | "absent" | "reportee";

export interface Visite {
  id: string;
  cabinetId: string;
  patientId: string;
  date: ISODate;
  heure: HeureHHMM;
  ordre: number;
  soins: string[];
  /** Soins cochés manuellement par l'infirmière. */
  soinsCoches: string[];
  statut: StatutVisite;
  /** Horodatage de la confirmation explicite (si réalisée). */
  confirmeeLe?: string;
}

export type StatutTransmission = "brouillon" | "a_valider" | "validee";

export interface Transmission {
  id: string;
  cabinetId: string;
  patientId?: string;
  creeLe: string; // ISO datetime
  auteur: string;
  source: "ecrite" | "audio";
  texte: string;
  resume?: string;
  /** true si le texte ou le résumé provient de la simulation. */
  simulation: boolean;
  nomFichierAudio?: string;
  statut: StatutTransmission;
  lu: boolean;
  prioritaire: boolean;
  valideeLe?: string;
}

export interface Tache {
  id: string;
  titre: string;
  cabinetId?: string;
  importante: boolean;
  faite: boolean;
  echeance?: ISODate;
}

export interface Parametres {
  /** Barème kilométrique indicatif (€/km), modifiable. */
  prixKm: number;
  prenomUtilisatrice: string;
}

export interface AppState {
  version: number;
  creeLe: ISODate;
  cabinetSelectionneId: string;
  cabinets: Cabinet[];
  patients: Patient[];
  remplacements: Remplacement[];
  indisponibilites: ISODate[];
  visites: Visite[];
  transmissions: Transmission[];
  taches: Tache[];
  parametres: Parametres;
}
