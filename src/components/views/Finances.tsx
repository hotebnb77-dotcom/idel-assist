"use client";

import { useState } from "react";
import { Car, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { addMonths, formatMonth, monthKey, todayISO } from "@/lib/dates";
import { calculerFinances, euros } from "@/lib/logic";
import { Avertissement, Card, Champ, IconButton, Pastille, TitreSection, inputClass } from "../ui";

export default function Finances() {
  const { state, dispatch } = useStore();
  const [mois, setMois] = useState(monthKey(todayISO()));
  const bilan = calculerFinances(state, mois);
  const max = Math.max(1, ...bilan.lignes.map((l) => l.retrocession));

  return (
    <div>
      <div className="mt-2">
        <Avertissement>
          Calculs <strong>indicatifs</strong> à partir de données fictives (journées marquées « Effectué » dans le planning). Ne remplace pas
          votre comptabilité ni l’avis d’un expert-comptable.
        </Avertissement>
      </div>

      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <IconButton label="Mois précédent" onClick={() => setMois(addMonths(mois, -1))}>
            <ChevronLeft />
          </IconButton>
          <h2 className="text-lg font-bold" aria-live="polite">
            {formatMonth(mois)}
          </h2>
          <IconButton label="Mois suivant" onClick={() => setMois(addMonths(mois, 1))}>
            <ChevronRight />
          </IconButton>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-bleu-50 p-3">
            <dt className="text-xs text-doux">Jours travaillés</dt>
            <dd className="text-2xl font-bold text-bleu-700">{bilan.totalJours}</dd>
          </div>
          <div className="rounded-2xl bg-bleu-50 p-3">
            <dt className="text-xs text-doux">Kilomètres</dt>
            <dd className="text-2xl font-bold text-bleu-700">{bilan.totalKm} km</dd>
          </div>
          <div className="col-span-2 rounded-2xl bg-vert-50 p-3">
            <dt className="text-xs text-doux">Rétrocessions à percevoir (fictif)</dt>
            <dd className="text-3xl font-bold text-vert-700">{euros(bilan.totalRetrocession)}</dd>
            <dd className="text-xs text-doux">sur {euros(bilan.totalHonoraires)} d’honoraires générés (fictifs)</dd>
          </div>
          <div className="col-span-2 rounded-2xl bg-amber-50 p-3">
            <dt className="flex items-center gap-1 text-xs text-doux">
              <Car size={14} aria-hidden /> Indemnités kilométriques estimées
            </dt>
            <dd className="text-xl font-bold text-amber-800">{euros(bilan.totalIndemnitesKm)}</dd>
          </div>
        </dl>
      </Card>

      <TitreSection>Détail par cabinet</TitreSection>
      <ul className="space-y-3" role="list">
        {bilan.lignes.map((l) => (
          <li key={l.cabinet.id}>
            <Card as="article">
              <div className="flex items-center gap-2">
                <Pastille couleur={l.cabinet.couleur} />
                <h3 className="flex-1 font-bold">{l.cabinet.nom}</h3>
                <span className="text-sm text-doux">{l.cabinet.tauxRetrocession} %</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                <div className="h-full rounded-full bg-vert-500" style={{ width: `${(l.retrocession / max) * 100}%` }} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-doux">Jours travaillés</dt>
                <dd className="text-right font-semibold">{l.joursTravailles}</dd>
                <dt className="text-doux">Kilomètres</dt>
                <dd className="text-right font-semibold">{l.km} km</dd>
                <dt className="text-doux">Honoraires générés</dt>
                <dd className="text-right font-semibold">{euros(l.honoraires)}</dd>
                <dt className="text-doux">Rétrocession perçue</dt>
                <dd className="text-right font-semibold text-vert-700">{euros(l.retrocession)}</dd>
                <dt className="text-doux">Part du titulaire</dt>
                <dd className="text-right font-semibold">{euros(l.partTitulaire)}</dd>
                <dt className="text-doux">Indemnités km</dt>
                <dd className="text-right font-semibold">{euros(l.indemnitesKm)}</dd>
              </dl>
            </Card>
          </li>
        ))}
      </ul>

      <TitreSection>Paramètre</TitreSection>
      <Card>
        <Champ label="Barème kilométrique indicatif (€/km)" aide="Valeur fictive modifiable. Vérifiez le barème officiel en vigueur.">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            className={inputClass}
            value={state.parametres.prixKm}
            onChange={(e) => dispatch({ type: "parametres/prixKm", prixKm: Number(e.target.value) })}
          />
        </Champ>
        <p className="mt-3 text-xs text-doux">
          Formules : honoraires = jours × honoraires moyens/jour du cabinet ; rétrocession = honoraires × taux ; km = (trajet A/R + km de
          tournée) par jour ; indemnités = km × barème.
        </p>
      </Card>
    </div>
  );
}
