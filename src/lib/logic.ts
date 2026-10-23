// Logique métier pure (sans interface), testée automatiquement.
import { minutes, monthKey } from "./dates";
import type {
  AppState,
  Cabinet,
  ISODate,
  Patient,
  Remplacement,
  Transmission,
  Visite,
} from "./types";

let compteur = 0;
export function newId(prefix: string): string {
  compteur += 1;
  return `${prefix}-${Date.now().toString(36)}-${compteur.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/* ------------------------------------------------------------------ */
/* Planning : conflits                                                 */
/* ------------------------------------------------------------------ */

export type Conflit =
  | { type: "chevauchement"; date: ISODate; remplacementIds: [string, string] }
  | { type: "indisponible"; date: ISODate; remplacementIds: [string] };

export function plagesSeChevauchent(a: Remplacement, b: Remplacement): boolean {
  return minutes(a.debut) < minutes(b.fin) && minutes(b.debut) < minutes(a.fin);
}

/** Détecte les remplacements qui se chevauchent ou tombent sur un jour d'indisponibilité. */
export function detecterConflits(
  remplacements: Remplacement[],
  indisponibilites: ISODate[],
): Conflit[] {
  const actifs = remplacements.filter((r) => r.statut !== "annule");
  const conflits: Conflit[] = [];
  const indispo = new Set(indisponibilites);
  for (let i = 0; i < actifs.length; i++) {
    const a = actifs[i];
    if (indispo.has(a.date)) conflits.push({ type: "indisponible", date: a.date, remplacementIds: [a.id] });
    for (let j = i + 1; j < actifs.length; j++) {
      const b = actifs[j];
      if (a.date === b.date && plagesSeChevauchent(a, b)) {
        conflits.push({ type: "chevauchement", date: a.date, remplacementIds: [a.id, b.id] });
      }
    }
  }
  return conflits.sort((x, y) => x.date.localeCompare(y.date));
}

export function datesEnConflit(conflits: Conflit[]): Set<ISODate> {
  return new Set(conflits.map((c) => c.date));
}

/* ------------------------------------------------------------------ */
/* Finances (calculs indicatifs sur données fictives)                  */
/* ------------------------------------------------------------------ */

export interface LigneFinance {
  cabinet: Cabinet;
  joursTravailles: number;
  km: number;
  honoraires: number;
  retrocession: number;
  partTitulaire: number;
  indemnitesKm: number;
}

export interface BilanFinances {
  lignes: LigneFinance[];
  totalJours: number;
  totalKm: number;
  totalHonoraires: number;
  totalRetrocession: number;
  totalIndemnitesKm: number;
}

export const arrondi2 = (n: number) => Math.round(n * 100) / 100;

/** Bilan d'un mois (AAAA-MM) à partir des journées marquées « effectuées ». */
export function calculerFinances(
  state: Pick<AppState, "cabinets" | "remplacements" | "parametres">,
  mois: string,
): BilanFinances {
  const lignes: LigneFinance[] = state.cabinets.map((cabinet) => {
    const jours = state.remplacements.filter(
      (r) => r.cabinetId === cabinet.id && r.statut === "effectue" && monthKey(r.date) === mois,
    );
    const joursTravailles = jours.length;
    const km = jours.reduce((s, r) => s + cabinet.kmTrajet + r.kmTournee, 0);
    const honoraires = joursTravailles * cabinet.honorairesJourMoyen;
    const retrocession = arrondi2((honoraires * cabinet.tauxRetrocession) / 100);
    return {
      cabinet,
      joursTravailles,
      km,
      honoraires: arrondi2(honoraires),
      retrocession,
      partTitulaire: arrondi2(honoraires - retrocession),
      indemnitesKm: arrondi2(km * state.parametres.prixKm),
    };
  });
  return {
    lignes,
    totalJours: lignes.reduce((s, l) => s + l.joursTravailles, 0),
    totalKm: lignes.reduce((s, l) => s + l.km, 0),
    totalHonoraires: arrondi2(lignes.reduce((s, l) => s + l.honoraires, 0)),
    totalRetrocession: arrondi2(lignes.reduce((s, l) => s + l.retrocession, 0)),
    totalIndemnitesKm: arrondi2(lignes.reduce((s, l) => s + l.indemnitesKm, 0)),
  };
}

export function euros(n: number): string {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/* ------------------------------------------------------------------ */
/* Tournées                                                            */
/* ------------------------------------------------------------------ */

export function visitesDuJour(visites: Visite[], cabinetId: string, date: ISODate): Visite[] {
  return visites
    .filter((v) => v.cabinetId === cabinetId && v.date === date)
    .sort((a, b) => a.ordre - b.ordre);
}

export function tousSoinsCoches(v: Visite): boolean {
  return v.soins.length > 0 && v.soins.every((s) => v.soinsCoches.includes(s));
}

/** Une visite ne peut être « réalisée » que si chaque soin a été coché manuellement. */
export function peutEtreValidee(v: Visite): boolean {
  return v.statut !== "realisee" && tousSoinsCoches(v);
}

/** Crée les visites d'une journée à partir des patients actifs du cabinet (sans doublon). */
export function preparerTournee(
  patients: Patient[],
  visitesExistantes: Visite[],
  cabinetId: string,
  date: ISODate,
): Visite[] {
  const deja = new Set(
    visitesExistantes.filter((v) => v.cabinetId === cabinetId && v.date === date).map((v) => v.patientId),
  );
  const maxOrdre = visitesExistantes
    .filter((v) => v.cabinetId === cabinetId && v.date === date)
    .reduce((m, v) => Math.max(m, v.ordre), 0);
  return patients
    .filter((p) => p.cabinetId === cabinetId && p.actif && !deja.has(p.id))
    .sort((a, b) => a.horaire.localeCompare(b.horaire))
    .map((p, i) => ({
      id: newId("vis"),
      cabinetId,
      patientId: p.id,
      date,
      heure: p.horaire,
      ordre: maxOrdre + i + 1,
      soins: [...p.soins],
      soinsCoches: [],
      statut: "a_faire" as const,
    }));
}

/** Déplace une visite d'un cran vers le haut (-1) ou le bas (+1) dans sa journée. */
export function deplacerVisite(visites: Visite[], id: string, direction: -1 | 1): Visite[] {
  const cible = visites.find((v) => v.id === id);
  if (!cible) return visites;
  const jour = visitesDuJour(visites, cible.cabinetId, cible.date);
  const idx = jour.findIndex((v) => v.id === id);
  const voisin = jour[idx + direction];
  if (!voisin) return visites;
  return visites.map((v) => {
    if (v.id === cible.id) return { ...v, ordre: voisin.ordre };
    if (v.id === voisin.id) return { ...v, ordre: cible.ordre };
    return v;
  });
}

export function prochainesVisites(visites: Visite[], cabinetId: string, date: ISODate, max = 3): Visite[] {
  return visitesDuJour(visites, cabinetId, date)
    .filter((v) => v.statut === "a_faire" || v.statut === "en_cours")
    .slice(0, max);
}

/* ------------------------------------------------------------------ */
/* Transmissions : simulation clairement signalée                      */
/* ------------------------------------------------------------------ */

export const MENTION_SIMULATION =
  "[SIMULATION] Texte d'exemple généré localement sur le téléphone. Il ne provient PAS de votre fichier audio et ne contient aucune observation clinique.";

/**
 * Simule une transcription. Volontairement, le texte produit n'invente
 * aucune observation : c'est un gabarit à compléter par l'infirmière.
 */
export function simulerTranscription(nomFichier: string): string {
  return [
    MENTION_SIMULATION,
    `Fichier sélectionné : « ${nomFichier} » (non envoyé, non analysé).`,
    "",
    "À compléter par vous après écoute :",
    "- Patient (prénom fictif) : …",
    "- Soins réalisés et confirmés : …",
    "- Points d'organisation pour la collègue : …",
  ].join("\n");
}

/**
 * « Résumé » simulé : extraction locale des premières phrases écrites
 * par l'utilisatrice. Rien n'est ajouté ni déduit.
 */
export function resumerLocalement(texte: string, maxPhrases = 2): string {
  const propre = texte
    .split("\n")
    .filter((l) => !l.startsWith("[SIMULATION]"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!propre) return "";
  const phrases = propre.match(/[^.!?]+[.!?]?/g) ?? [propre];
  const extrait = phrases
    .slice(0, maxPhrases)
    .map((p) => p.trim())
    .join(" ");
  return extrait.length > 240 ? `${extrait.slice(0, 237)}…` : extrait;
}

/** Une transmission ne peut être validée que par une relecture humaine explicite. */
export function raisonsBlocageValidation(texte: string, relectureConfirmee: boolean): string[] {
  const raisons: string[] = [];
  if (!texte.trim()) raisons.push("Le texte est vide.");
  if (texte.includes("[SIMULATION]"))
    raisons.push("Retirez la ligne « [SIMULATION] » après avoir réécrit le texte vous-même.");
  if (/:\s*…\s*$/m.test(texte)) raisons.push("Complétez ou supprimez les lignes se terminant par « … ».");
  if (!relectureConfirmee) raisons.push("Cochez la case de relecture humaine.");
  return raisons;
}

export function peutValiderTransmission(t: Pick<Transmission, "texte">, relectureConfirmee: boolean): boolean {
  return raisonsBlocageValidation(t.texte, relectureConfirmee).length === 0;
}

export function transmissionsNonLues(transmissions: Transmission[], cabinetId: string): Transmission[] {
  return transmissions.filter((t) => t.cabinetId === cabinetId && !t.lu);
}

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */

export function rechercherPatients(patients: Patient[], requete: string, cabinetId: string | "tous"): Patient[] {
  const q = requete
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return patients
    .filter((p) => cabinetId === "tous" || p.cabinetId === cabinetId)
    .filter((p) => {
      if (!q) return true;
      const cible = `${p.prenom} ${p.identifiant} ${p.adresse} ${p.soins.join(" ")}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return cible.includes(q);
    })
    .sort((a, b) => a.prenom.localeCompare(b.prenom, "fr"));
}

export function prochainIdentifiant(patients: Patient[], cabinet: Cabinet): string {
  const code = cabinet.nom
    .replace(/^cabinet\s+(des|du|de la|de|les|le|la)?\s*/i, "")
    .normalize("NFD")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  const n = patients.filter((p) => p.identifiant.startsWith(`DEMO-${code}-`)).length + 1;
  return `DEMO-${code}-${String(n).padStart(3, "0")}`;
}
