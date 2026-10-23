// Toutes les modifications de données passent par ce réducteur (testé).
import { creerEtatDemo } from "./demo-data";
import { deplacerVisite, newId, peutEtreValidee, preparerTournee } from "./logic";
import type {
  AppState,
  Cabinet,
  ISODate,
  Patient,
  Remplacement,
  StatutRemplacement,
  StatutVisite,
  Tache,
  Transmission,
} from "./types";

export type Action =
  | { type: "hydrater"; state: AppState }
  | { type: "reinitialiser"; today: ISODate }
  | { type: "cabinet/selectionner"; id: string }
  | { type: "cabinet/enregistrer"; cabinet: Cabinet }
  | { type: "cabinet/supprimer"; id: string }
  | { type: "patient/enregistrer"; patient: Patient }
  | { type: "patient/supprimer"; id: string }
  | { type: "remplacement/enregistrer"; remplacement: Remplacement }
  | { type: "remplacement/statut"; id: string; statut: StatutRemplacement }
  | { type: "remplacement/supprimer"; id: string }
  | { type: "indisponibilite/basculer"; date: ISODate }
  | { type: "visite/basculerSoin"; id: string; soin: string }
  | { type: "visite/statut"; id: string; statut: StatutVisite; maintenant?: string }
  | { type: "visite/deplacer"; id: string; direction: -1 | 1 }
  | { type: "visite/ajouter"; patientId: string; date: ISODate }
  | { type: "visite/supprimer"; id: string }
  | { type: "tournee/preparer"; cabinetId: string; date: ISODate }
  | { type: "transmission/enregistrer"; transmission: Transmission }
  | { type: "transmission/lue"; id: string; lu: boolean }
  | { type: "transmission/supprimer"; id: string }
  | { type: "tache/ajouter"; titre: string; importante: boolean; cabinetId?: string }
  | { type: "tache/basculer"; id: string }
  | { type: "tache/supprimer"; id: string }
  | { type: "parametres/prixKm"; prixKm: number }
  | { type: "parametres/prenom"; prenom: string };

const upsert = <T extends { id: string }>(liste: T[], item: T): T[] =>
  liste.some((x) => x.id === item.id) ? liste.map((x) => (x.id === item.id ? item : x)) : [...liste, item];

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrater":
      return action.state;
    case "reinitialiser":
      return creerEtatDemo(action.today);

    case "cabinet/selectionner":
      return state.cabinets.some((c) => c.id === action.id) ? { ...state, cabinetSelectionneId: action.id } : state;
    case "cabinet/enregistrer":
      return { ...state, cabinets: upsert(state.cabinets, action.cabinet) };
    case "cabinet/supprimer": {
      if (state.cabinets.length <= 1) return state; // garder au moins un cabinet
      const cabinets = state.cabinets.filter((c) => c.id !== action.id);
      const garde = <T extends { cabinetId?: string }>(x: T) => x.cabinetId !== action.id;
      return {
        ...state,
        cabinets,
        cabinetSelectionneId:
          state.cabinetSelectionneId === action.id ? cabinets[0].id : state.cabinetSelectionneId,
        patients: state.patients.filter(garde),
        remplacements: state.remplacements.filter(garde),
        visites: state.visites.filter(garde),
        transmissions: state.transmissions.filter(garde),
        taches: state.taches.filter(garde),
      };
    }

    case "patient/enregistrer":
      return { ...state, patients: upsert(state.patients, action.patient) };
    case "patient/supprimer":
      return {
        ...state,
        patients: state.patients.filter((p) => p.id !== action.id),
        visites: state.visites.filter((v) => v.patientId !== action.id),
        transmissions: state.transmissions.map((t) =>
          t.patientId === action.id ? { ...t, patientId: undefined } : t,
        ),
      };

    case "remplacement/enregistrer":
      return { ...state, remplacements: upsert(state.remplacements, action.remplacement) };
    case "remplacement/statut":
      return {
        ...state,
        remplacements: state.remplacements.map((r) => (r.id === action.id ? { ...r, statut: action.statut } : r)),
      };
    case "remplacement/supprimer":
      return { ...state, remplacements: state.remplacements.filter((r) => r.id !== action.id) };
    case "indisponibilite/basculer":
      return {
        ...state,
        indisponibilites: state.indisponibilites.includes(action.date)
          ? state.indisponibilites.filter((d) => d !== action.date)
          : [...state.indisponibilites, action.date].sort(),
      };

    case "visite/basculerSoin":
      return {
        ...state,
        visites: state.visites.map((v) => {
          if (v.id !== action.id || !v.soins.includes(action.soin)) return v;
          const coche = v.soinsCoches.includes(action.soin);
          const soinsCoches = coche ? v.soinsCoches.filter((s) => s !== action.soin) : [...v.soinsCoches, action.soin];
          // Décocher un soin annule la validation : rien n'est considéré réalisé sans confirmation.
          const statut: StatutVisite =
            v.statut === "realisee" && coche ? "en_cours" : v.statut === "a_faire" ? "en_cours" : v.statut;
          return { ...v, soinsCoches, statut, confirmeeLe: statut === "realisee" ? v.confirmeeLe : undefined };
        }),
      };
    case "visite/statut":
      return {
        ...state,
        visites: state.visites.map((v) => {
          if (v.id !== action.id) return v;
          if (action.statut === "realisee") {
            // Garde-fou : la validation exige que chaque soin ait été coché.
            if (!peutEtreValidee(v)) return v;
            return { ...v, statut: "realisee", confirmeeLe: action.maintenant ?? new Date().toISOString() };
          }
          return { ...v, statut: action.statut, confirmeeLe: undefined };
        }),
      };
    case "visite/deplacer":
      return { ...state, visites: deplacerVisite(state.visites, action.id, action.direction) };
    case "visite/ajouter": {
      const p = state.patients.find((x) => x.id === action.patientId);
      if (!p) return state;
      // Ajout manuel : fonctionne aussi pour un patient inactif, sans doublon le même jour.
      const nouvelles = preparerTournee([{ ...p, actif: true }], state.visites, p.cabinetId, action.date);
      return { ...state, visites: [...state.visites, ...nouvelles] };
    }
    case "visite/supprimer":
      return { ...state, visites: state.visites.filter((v) => v.id !== action.id) };
    case "tournee/preparer":
      return {
        ...state,
        visites: [...state.visites, ...preparerTournee(state.patients, state.visites, action.cabinetId, action.date)],
      };

    case "transmission/enregistrer":
      return { ...state, transmissions: upsert(state.transmissions, action.transmission) };
    case "transmission/lue":
      return {
        ...state,
        transmissions: state.transmissions.map((t) => (t.id === action.id ? { ...t, lu: action.lu } : t)),
      };
    case "transmission/supprimer":
      return { ...state, transmissions: state.transmissions.filter((t) => t.id !== action.id) };

    case "tache/ajouter": {
      const titre = action.titre.trim();
      if (!titre) return state;
      const tache: Tache = {
        id: newId("ta"),
        titre,
        importante: action.importante,
        faite: false,
        cabinetId: action.cabinetId,
      };
      return { ...state, taches: [tache, ...state.taches] };
    }
    case "tache/basculer":
      return { ...state, taches: state.taches.map((t) => (t.id === action.id ? { ...t, faite: !t.faite } : t)) };
    case "tache/supprimer":
      return { ...state, taches: state.taches.filter((t) => t.id !== action.id) };

    case "parametres/prixKm":
      return Number.isFinite(action.prixKm) && action.prixKm >= 0
        ? { ...state, parametres: { ...state.parametres, prixKm: action.prixKm } }
        : state;
    case "parametres/prenom":
      return { ...state, parametres: { ...state.parametres, prenomUtilisatrice: action.prenom.slice(0, 30) } };
    default:
      return state;
  }
}
