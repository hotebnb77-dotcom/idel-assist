"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Plus as PlusIcon, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { newId } from "@/lib/logic";
import type { Cabinet, CouleurCabinet } from "@/lib/types";
import { Avertissement, Badge, Button, Card, Champ, Confirmation, Feuille, Pastille, couleurs, cx, inputClass } from "../ui";

const nouveau = (): Cabinet => ({
  id: newId("cab"),
  nom: "",
  ville: "",
  adresse: "",
  couleur: "violet",
  tauxRetrocession: 80,
  honorairesJourMoyen: 400,
  kmTrajet: 20,
});

export default function Cabinets() {
  const { state, dispatch } = useStore();
  const [edition, setEdition] = useState<Cabinet | null>(null);
  const [aSupprimer, setASupprimer] = useState<Cabinet | null>(null);
  const existe = edition ? state.cabinets.some((c) => c.id === edition.id) : false;
  const compte = (id: string) => ({
    patients: state.patients.filter((p) => p.cabinetId === id).length,
    jours: state.remplacements.filter((r) => r.cabinetId === id && r.statut !== "annule").length,
    transmissions: state.transmissions.filter((t) => t.cabinetId === id).length,
  });

  return (
    <div>
      <p className="mt-2 text-sm text-doux">
        Chaque cabinet a son propre planning, ses patients fictifs et ses transmissions. Le cabinet sélectionné s’affiche en haut de l’écran.
      </p>
      <ul className="mt-3 space-y-3" role="list">
        {state.cabinets.map((c) => {
          const actif = c.id === state.cabinetSelectionneId;
          const n = compte(c.id);
          return (
            <li key={c.id}>
              <Card as="article" className={cx(actif && "ring-2 ring-bleu-300")}>
                <div className="flex items-start gap-3">
                  <span className={cx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", couleurs[c.couleur].fond)}>
                    <Pastille couleur={c.couleur} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold">{c.nom}</h2>
                    <p className="text-sm text-doux">{c.adresse}</p>
                    <p className="mt-1 text-xs text-doux">
                      {n.patients} patients · {n.jours} jours planifiés · {n.transmissions} transmissions
                    </p>
                    <p className="text-xs text-doux">
                      Rétrocession {c.tauxRetrocession} % · {c.honorairesJourMoyen} €/jour (fictif) · {c.kmTrajet} km A/R
                    </p>
                  </div>
                  {actif && <Badge ton="bleu">Actif</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variante={actif ? "secondaire" : "primaire"}
                    disabled={actif}
                    onClick={() => dispatch({ type: "cabinet/selectionner", id: c.id })}
                  >
                    <CheckCircle2 size={18} aria-hidden /> {actif ? "Sélectionné" : "Sélectionner"}
                  </Button>
                  <Button variante="secondaire" onClick={() => setEdition({ ...c })}>
                    <Pencil size={18} aria-hidden /> Modifier
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      <Button pleineLargeur className="mt-4" onClick={() => setEdition(nouveau())}>
        <PlusIcon size={20} aria-hidden /> Nouveau cabinet
      </Button>

      <Feuille ouverte={edition !== null} onFermer={() => setEdition(null)} titre={existe ? "Modifier le cabinet" : "Nouveau cabinet"}>
        {edition && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "cabinet/enregistrer", cabinet: { ...edition, nom: edition.nom.trim() } });
              if (!existe) dispatch({ type: "cabinet/selectionner", id: edition.id });
              setEdition(null);
            }}
          >
            <Avertissement>Utilisez uniquement des noms et adresses fictifs.</Avertissement>
            <Champ label="Nom du cabinet">
              <input required className={inputClass} value={edition.nom} onChange={(e) => setEdition({ ...edition, nom: e.target.value })} placeholder="Cabinet des Exemples" />
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Ville">
                <input className={inputClass} value={edition.ville} onChange={(e) => setEdition({ ...edition, ville: e.target.value })} />
              </Champ>
              <Champ label="Km aller-retour">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={inputClass}
                  value={edition.kmTrajet}
                  onChange={(e) => setEdition({ ...edition, kmTrajet: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Champ>
            </div>
            <Champ label="Adresse (fictive)">
              <input className={inputClass} value={edition.adresse} onChange={(e) => setEdition({ ...edition, adresse: e.target.value })} />
            </Champ>
            <div className="grid grid-cols-2 gap-3">
              <Champ label="Rétrocession (%)" aide="Part reversée à la remplaçante">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={edition.tauxRetrocession}
                  onChange={(e) => setEdition({ ...edition, tauxRetrocession: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                />
              </Champ>
              <Champ label="Honoraires/jour (€)" aide="Moyenne fictive">
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className={inputClass}
                  value={edition.honorairesJourMoyen}
                  onChange={(e) => setEdition({ ...edition, honorairesJourMoyen: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Champ>
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-semibold">Couleur</legend>
              <div className="flex gap-2">
                {(Object.keys(couleurs) as CouleurCabinet[]).map((k) => (
                  <label key={k} className={cx("flex h-12 w-12 items-center justify-center rounded-2xl ring-2", edition.couleur === k ? "ring-bleu-500" : "ring-transparent", couleurs[k].fond)}>
                    <input type="radio" name="couleur" className="sr-only" checked={edition.couleur === k} onChange={() => setEdition({ ...edition, couleur: k })} />
                    <Pastille couleur={k} className="h-5 w-5" />
                    <span className="sr-only">{couleurs[k].nom}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit" pleineLargeur disabled={!edition.nom.trim()}>
              Enregistrer
            </Button>
            {existe && (
              <Button
                variante="danger"
                pleineLargeur
                disabled={state.cabinets.length <= 1}
                onClick={() => {
                  setASupprimer(edition);
                  setEdition(null);
                }}
              >
                <Trash2 size={18} aria-hidden /> Supprimer ce cabinet
              </Button>
            )}
          </form>
        )}
      </Feuille>

      <Confirmation
        ouverte={aSupprimer !== null}
        titre="Supprimer le cabinet ?"
        variante="danger"
        libelleConfirmer="Supprimer"
        onAnnuler={() => setASupprimer(null)}
        onConfirmer={() => {
          if (aSupprimer) dispatch({ type: "cabinet/supprimer", id: aSupprimer.id });
          setASupprimer(null);
        }}
        message={
          <p>
            « {aSupprimer?.nom} » sera supprimé avec ses patients fictifs, son planning, ses visites et ses transmissions. Vous pourrez toujours
            réinitialiser la démo depuis les réglages.
          </p>
        }
      />
    </div>
  );
}
