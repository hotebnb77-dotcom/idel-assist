"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, House, LayoutGrid, MessageSquareText, Route as RouteIcon } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { transmissionsNonLues } from "@/lib/logic";
import { Feuille, Pastille, cx } from "./ui";
import Accueil from "./views/Accueil";
import Planning from "./views/Planning";
import Tournee from "./views/Tournee";
import Transmissions from "./views/Transmissions";
import Plus from "./views/Plus";
import Cabinets from "./views/Cabinets";
import Patients from "./views/Patients";
import Finances from "./views/Finances";
import Reglages from "./views/Reglages";

export type Vue =
  | "accueil"
  | "planning"
  | "tournee"
  | "transmissions"
  | "plus"
  | "cabinets"
  | "patients"
  | "finances"
  | "reglages";

const VUES: Vue[] = ["accueil", "planning", "tournee", "transmissions", "plus", "cabinets", "patients", "finances", "reglages"];

const titres: Record<Vue, string> = {
  accueil: "Accueil",
  planning: "Planning",
  tournee: "Tournée",
  transmissions: "Transmissions",
  plus: "Menu",
  cabinets: "Cabinets",
  patients: "Patients",
  finances: "Finances",
  reglages: "Réglages",
};

const ongletParent: Partial<Record<Vue, Vue>> = { cabinets: "plus", patients: "plus", finances: "plus", reglages: "plus" };

function lireVue(): Vue {
  const h = window.location.hash.replace(/^#\/?/, "") as Vue;
  return VUES.includes(h) ? h : "accueil";
}

/** Navigation par « # » dans l'adresse : simple, fonctionne hors-ligne et avec le bouton retour. */
export function useNavigation() {
  const [vue, setVue] = useState<Vue>("accueil");
  useEffect(() => {
    setVue(lireVue());
    const onHash = () => {
      setVue(lireVue());
      window.scrollTo({ top: 0 });
      document.getElementById("contenu")?.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const aller = useCallback((v: Vue) => {
    if (window.location.hash !== `#/${v}`) window.location.hash = `/${v}`;
    else setVue(v);
  }, []);
  return { vue, aller };
}

export type Aller = (v: Vue) => void;

const onglets: { vue: Vue; libelle: string; Icone: typeof House }[] = [
  { vue: "accueil", libelle: "Accueil", Icone: House },
  { vue: "planning", libelle: "Agenda", Icone: CalendarDays },
  { vue: "tournee", libelle: "Tournée", Icone: RouteIcon },
  { vue: "transmissions", libelle: "Messages", Icone: MessageSquareText },
  { vue: "plus", libelle: "Menu", Icone: LayoutGrid },
];

export function SelecteurCabinet() {
  const { state, dispatch } = useStore();
  const cabinet = useCabinetSelectionne();
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex min-h-10 max-w-[11rem] items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
        aria-label={`Cabinet sélectionné : ${cabinet.nom}. Changer de cabinet`}
      >
        <Pastille couleur={cabinet.couleur} />
        <span className="truncate">{cabinet.nom}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      <Feuille ouverte={ouvert} onFermer={() => setOuvert(false)} titre="Choisir le cabinet">
        <ul className="space-y-2" role="list">
          {state.cabinets.map((c) => {
            const actif = c.id === cabinet.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={actif}
                  onClick={() => {
                    dispatch({ type: "cabinet/selectionner", id: c.id });
                    setOuvert(false);
                  }}
                  className={cx(
                    "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left ring-1",
                    actif ? "bg-bleu-50 ring-bleu-200" : "bg-white ring-slate-200",
                  )}
                >
                  <Pastille couleur={c.couleur} />
                  <span className="flex-1">
                    <span className="block font-semibold">{c.nom}</span>
                    <span className="block text-sm text-doux">{c.ville}</span>
                  </span>
                  {actif && <span className="text-sm font-semibold text-bleu-700">Sélectionné</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Feuille>
    </>
  );
}

export default function AppShell() {
  const { vue, aller } = useNavigation();
  const { state } = useStore();
  const cabinet = useCabinetSelectionne();
  const nonLues = transmissionsNonLues(state.transmissions, cabinet.id).length;
  const ongletActif = ongletParent[vue] ?? vue;
  const parent = ongletParent[vue];
  const zone = useRef<HTMLElement>(null);
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    zone.current?.scrollTo({ top: 0 });
    setDefile(false);
  }, [vue]);

  return (
    // Sur ordinateur, l'application s'affiche dans un cadre de téléphone ; sur mobile, en plein écran.
    <div className="min-h-dvh md:flex md:items-center md:justify-center md:bg-gradient-to-br md:from-sky-100 md:via-fond md:to-emerald-50 md:py-6">
      <div className="relative mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-fond md:h-[min(860px,calc(100dvh-3rem))] md:w-[400px] md:rounded-[3rem] md:shadow-[0_30px_80px_rgba(30,42,59,0.25)] md:ring-[10px] md:ring-slate-900">
        <header
          className={cx(
            "pt-safe z-20 shrink-0 bg-fond/90 px-4 pb-2 backdrop-blur transition-shadow",
            defile && "shadow-[0_1px_0_rgba(30,42,59,0.08)]",
          )}
        >
          <div className="flex min-h-10 items-center justify-between gap-2">
            {parent ? (
              <a
                href={`#/${parent}`}
                onClick={(e) => {
                  e.preventDefault();
                  aller(parent);
                }}
                className="-ml-2 inline-flex min-h-10 items-center gap-0.5 rounded-full pr-2 text-base font-medium text-bleu-600"
              >
                <ChevronLeft size={24} aria-hidden />
                {titres[parent]}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-vert-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-[11px] font-bold text-white">
                  IA
                </span>
                IDEL Assist
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800" title="Prototype · données fictives uniquement · ne saisissez aucune donnée réelle">
                  démo
                </span>
              </span>
            )}
            <SelecteurCabinet />
          </div>
          <h1 className="mt-1 truncate text-[2rem] font-bold leading-tight tracking-tight">{titres[vue]}</h1>
        </header>

        <main
          id="contenu"
          ref={zone}
          onScroll={(e) => setDefile(e.currentTarget.scrollTop > 4)}
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-1"
        >
          {vue === "accueil" && <Accueil aller={aller} />}
          {vue === "planning" && <Planning />}
          {vue === "tournee" && <Tournee />}
          {vue === "transmissions" && <Transmissions />}
          {vue === "plus" && <Plus aller={aller} />}
          {vue === "cabinets" && <Cabinets />}
          {vue === "patients" && <Patients />}
          {vue === "finances" && <Finances />}
          {vue === "reglages" && <Reglages />}
          <p className="mt-6 text-center text-[11px] text-doux">Prototype · données fictives uniquement · ne saisissez aucune donnée réelle</p>
        </main>

        <nav aria-label="Navigation principale" className="pb-safe z-30 shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur">
          <ul className="grid grid-cols-5" role="list">
            {onglets.map(({ vue: v, libelle, Icone }) => {
              const actif = ongletActif === v;
              return (
                <li key={v}>
                  <a
                    href={`#/${v}`}
                    onClick={(e) => {
                      e.preventDefault();
                      aller(v);
                    }}
                    aria-current={actif ? "page" : undefined}
                    className={cx(
                      "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10.5px] font-semibold transition-colors",
                      actif ? "text-bleu-600" : "text-slate-400",
                    )}
                  >
                    <Icone size={24} aria-hidden strokeWidth={actif ? 2.4 : 1.9} fill={actif && v !== "plus" ? "currentColor" : "none"} fillOpacity={0.15} />
                    <span className="truncate">{libelle}</span>
                    {v === "transmissions" && nonLues > 0 && (
                      <span className="absolute left-1/2 top-1 ml-2 min-w-[18px] rounded-full bg-rose-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                        {nonLues}
                        <span className="sr-only"> non lues</span>
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
