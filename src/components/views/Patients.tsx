"use client";

import { useState } from "react";
import { Clock, MapPin, Plus as PlusIcon, Search, Trash2, X } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { newId, prochainIdentifiant, rechercherPatients } from "@/lib/logic";
import type { Patient } from "@/lib/types";
import { Avertissement, Badge, Button, Card, Champ, Confirmation, Feuille, IconButton, Pastille, Vide, cx, inputClass } from "../ui";

const SOINS_SUGGERES = [
  "Prise de sang",
  "Pansement simple",
  "Injection sous-cutanée",
  "Surveillance glycémie",
  "Aide à la prise du traitement",
  "Bas de contention",
];

export default function Patients() {
  const { state, dispatch } = useStore();
  const cabinetSel = useCabinetSelectionne();
  const [requete, setRequete] = useState("");
  const [filtre, setFiltre] = useState<string>(cabinetSel.id);
  const [edition, setEdition] = useState<Patient | null>(null);
  const [nouveauSoin, setNouveauSoin] = useState("");
  const [aSupprimer, setASupprimer] = useState<Patient | null>(null);

  const resultats = rechercherPatients(state.patients, requete, filtre);
  const cabinet = (id: string) => state.cabinets.find((c) => c.id === id);
  const existe = edition ? state.patients.some((p) => p.id === edition.id) : false;

  const creer = () => {
    const cab = cabinet(filtre) ?? cabinetSel;
    setEdition({
      id: newId("pat"),
      cabinetId: cab.id,
      prenom: "",
      identifiant: prochainIdentifiant(state.patients, cab),
      adresse: "",
      soins: [],
      horaire: "08:00",
      notes: "",
      actif: true,
    });
  };

  const ajouterSoin = (s: string) => {
    const v = s.trim();
    if (!edition || !v || edition.soins.includes(v)) return;
    setEdition({ ...edition, soins: [...edition.soins, v] });
    setNouveauSoin("");
  };

  return (
    <div>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} aria-hidden />
        <label htmlFor="recherche-patient" className="sr-only">
          Rechercher un patient
        </label>
        <input
          id="recherche-patient"
          type="search"
          className={cx(inputClass, "pl-11")}
          placeholder="Prénom, identifiant, adresse, soin…"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer par cabinet">
        {[{ id: "tous", nom: "Tous" }, ...state.cabinets].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filtre === c.id}
            onClick={() => setFiltre(c.id)}
            className={cx(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1",
              filtre === c.id ? "bg-bleu-600 text-white ring-bleu-600" : "bg-white text-doux ring-slate-200",
            )}
          >
            {"couleur" in c && <Pastille couleur={c.couleur} className="h-2.5 w-2.5" />}
            {c.nom}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-doux" aria-live="polite">
        {resultats.length} patient{resultats.length > 1 ? "s" : ""} fictif{resultats.length > 1 ? "s" : ""}
      </p>
      <ul className="mt-2 space-y-3" role="list">
        {resultats.length === 0 && (
          <li>
            <Vide>Aucun patient ne correspond.</Vide>
          </li>
        )}
        {resultats.map((p) => {
          const c = cabinet(p.cabinetId);
          return (
            <li key={p.id}>
              <button type="button" onClick={() => setEdition({ ...p, soins: [...p.soins] })} className="w-full text-left">
                <Card as="div" className={cx(!p.actif && "opacity-60")}>
                  <div className="flex items-center gap-2">
                    <h2 className="flex-1 text-lg font-bold">{p.prenom}</h2>
                    {!p.actif && <Badge>Inactif</Badge>}
                    <span className="flex items-center gap-1 text-sm font-semibold text-bleu-700">
                      <Clock size={14} aria-hidden /> {p.horaire}
                    </span>
                  </div>
                  <p className="text-xs text-doux">
                    {p.identifiant} {c && <>· {c.nom}</>}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-doux">
                    <MapPin size={14} aria-hidden /> {p.adresse}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.soins.map((s) => (
                      <Badge key={s} ton="vert">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  {p.notes && <p className="mt-2 text-sm">📝 {p.notes}</p>}
                </Card>
              </button>
            </li>
          );
        })}
      </ul>
      <Button pleineLargeur className="mt-4" onClick={creer}>
        <PlusIcon size={20} aria-hidden /> Nouveau patient fictif
      </Button>

      <Feuille ouverte={edition !== null} onFermer={() => setEdition(null)} titre={existe ? "Fiche patient (fictive)" : "Nouveau patient fictif"}>
        {edition && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "patient/enregistrer", patient: { ...edition, prenom: edition.prenom.trim() } });
              setEdition(null);
            }}
          >
            <Avertissement>Démonstration : prénom et adresse inventés uniquement. Pas de nom de famille, pas de numéro de sécurité sociale.</Avertissement>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Prénom (fictif)">
                <input required className={inputClass} value={edition.prenom} onChange={(e) => setEdition({ ...edition, prenom: e.target.value })} />
              </Champ>
              <Champ label="Identifiant">
                <input className={cx(inputClass, "bg-slate-50")} value={edition.identifiant} readOnly aria-readonly />
              </Champ>
            </div>
            <Champ label="Cabinet">
              <select className={inputClass} value={edition.cabinetId} onChange={(e) => setEdition({ ...edition, cabinetId: e.target.value })}>
                {state.cabinets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Adresse (inventée)">
              <input className={inputClass} value={edition.adresse} onChange={(e) => setEdition({ ...edition, adresse: e.target.value })} />
            </Champ>
            <Champ label="Horaire habituel">
              <input type="time" className={inputClass} value={edition.horaire} onChange={(e) => setEdition({ ...edition, horaire: e.target.value })} />
            </Champ>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">Soins prévus</legend>
              <ul className="flex flex-wrap gap-2" role="list">
                {edition.soins.map((s) => (
                  <li key={s} className="flex items-center gap-1 rounded-full bg-vert-100 py-1 pl-3 pr-1 text-sm text-vert-700">
                    {s}
                    <button
                      type="button"
                      aria-label={`Retirer ${s}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full active:bg-vert-50"
                      onClick={() => setEdition({ ...edition, soins: edition.soins.filter((x) => x !== s) })}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-2">
                {SOINS_SUGGERES.filter((s) => !edition.soins.includes(s)).map((s) => (
                  <button key={s} type="button" className="min-h-10 rounded-full bg-slate-100 px-3 text-sm text-doux" onClick={() => ajouterSoin(s)}>
                    + {s}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <label htmlFor="soin-libre" className="sr-only">
                  Autre soin
                </label>
                <input
                  id="soin-libre"
                  className={inputClass}
                  placeholder="Autre soin…"
                  value={nouveauSoin}
                  onChange={(e) => setNouveauSoin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ajouterSoin(nouveauSoin);
                    }
                  }}
                />
                <IconButton label="Ajouter ce soin" className="bg-bleu-50 text-bleu-700" onClick={() => ajouterSoin(nouveauSoin)}>
                  <PlusIcon />
                </IconButton>
              </div>
            </fieldset>
            <Champ label="Notes pratiques (fictives)" aide="Organisation uniquement (accès, horaires…). Pas d’observation clinique.">
              <textarea className={cx(inputClass, "min-h-24")} value={edition.notes} onChange={(e) => setEdition({ ...edition, notes: e.target.value })} />
            </Champ>
            <label className="flex min-h-12 items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-vert-600" checked={edition.actif} onChange={(e) => setEdition({ ...edition, actif: e.target.checked })} />
              <span>Patient actif (inclus dans la préparation des tournées)</span>
            </label>
            <Button type="submit" pleineLargeur disabled={!edition.prenom.trim() || edition.soins.length === 0}>
              Enregistrer
            </Button>
            {edition.soins.length === 0 && <p className="text-center text-xs text-doux">Ajoutez au moins un soin prévu.</p>}
            {existe && (
              <Button
                variante="danger"
                pleineLargeur
                onClick={() => {
                  setASupprimer(edition);
                  setEdition(null);
                }}
              >
                <Trash2 size={18} aria-hidden /> Supprimer la fiche
              </Button>
            )}
          </form>
        )}
      </Feuille>

      <Confirmation
        ouverte={aSupprimer !== null}
        titre="Supprimer la fiche ?"
        variante="danger"
        libelleConfirmer="Supprimer"
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={() => {
          if (aSupprimer) dispatch({ type: "patient/supprimer", id: aSupprimer.id });
          setASupprimer(null);
        }}
        message={<p>La fiche fictive de « {aSupprimer?.prenom} » et ses visites planifiées seront supprimées.</p>}
      />
    </div>
  );
}
