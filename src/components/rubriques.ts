import {
  Building2,
  CalendarDays,
  MessageSquareText,
  Route as RouteIcon,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import type { Vue } from "./AppShell";

export type Rubrique = {
  vue: Vue;
  libelle: string;
  detail: string;
  Icone: typeof Users;
  /** Dégradé de l'icône, façon icône d'application */
  degrade: string;
};

/** Toutes les rubriques de l'application, présentées comme des icônes d'app. */
export const rubriques: Rubrique[] = [
  { vue: "planning", libelle: "Agenda", detail: "Calendrier et remplacements", Icone: CalendarDays, degrade: "from-sky-400 to-blue-600" },
  { vue: "tournee", libelle: "Tournée", detail: "Visites du jour", Icone: RouteIcon, degrade: "from-emerald-400 to-teal-600" },
  { vue: "transmissions", libelle: "Messages", detail: "Transmissions", Icone: MessageSquareText, degrade: "from-violet-400 to-purple-600" },
  { vue: "patients", libelle: "Patients", detail: "Fiches et recherche", Icone: Users, degrade: "from-rose-400 to-pink-600" },
  { vue: "cabinets", libelle: "Cabinets", detail: "Vos lieux de travail", Icone: Building2, degrade: "from-indigo-400 to-indigo-600" },
  { vue: "finances", libelle: "Finances", detail: "Jours, km, rétrocessions", Icone: Wallet, degrade: "from-amber-400 to-orange-500" },
  { vue: "reglages", libelle: "Réglages", detail: "Données de la démo", Icone: Settings, degrade: "from-slate-400 to-slate-600" },
];
