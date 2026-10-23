"use client";

import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { todayISO } from "./dates";
import { creerEtatDemo, STATE_VERSION } from "./demo-data";
import { reducer, type Action } from "./reducer";
import type { AppState } from "./types";

export const STORAGE_KEY = "idel-assist-demo-v1";

interface StoreValue {
  state: AppState;
  dispatch: (a: Action) => void;
  sauvegardeDisponible: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function chargerEtat(): AppState | null {
  try {
    const brut = window.localStorage.getItem(STORAGE_KEY);
    if (!brut) return null;
    const s = JSON.parse(brut) as AppState;
    if (s?.version !== STATE_VERSION || !Array.isArray(s.cabinets) || s.cabinets.length === 0) return null;
    return s;
  } catch {
    return null;
  }
}

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(reducer, initial ?? creerEtatDemo(todayISO()));
  const [pret, setPret] = useState(Boolean(initial));
  const [sauvegardeDisponible, setSauvegardeDisponible] = useState(true);
  const hydrate = useRef(Boolean(initial));

  // Chargement depuis la mémoire du téléphone (après l'affichage initial).
  useEffect(() => {
    if (hydrate.current) return;
    hydrate.current = true;
    const s = chargerEtat();
    if (s) dispatch({ type: "hydrater", state: s });
    setPret(true);
  }, []);

  // Sauvegarde locale automatique à chaque modification.
  useEffect(() => {
    if (!pret) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setSauvegardeDisponible(true);
    } catch {
      setSauvegardeDisponible(false);
    }
  }, [state, pret]);

  if (!pret) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-500" role="status">
        Chargement de la démonstration…
      </div>
    );
  }

  return <StoreContext.Provider value={{ state, dispatch, sauvegardeDisponible }}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}

export function useCabinetSelectionne() {
  const { state } = useStore();
  return state.cabinets.find((c) => c.id === state.cabinetSelectionneId) ?? state.cabinets[0];
}
