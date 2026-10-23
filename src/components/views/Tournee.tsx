"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, MapPin, MoreHorizontal, Plus as PlusIcon, Trash2, Wand2 } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { addDays, formatDateLong, todayISO } from "@/lib/dates";
import { peutEtreValidee, visitesDuJour } from "@/lib/logic";
import type { StatutVisite, Visite } from "@/lib/types";
import { Avertissement, Badge, Button, Card, Confirmation, Feuille, IconButton, Segments, Vide, cx, inputClass } from "../ui";

const statuts: Record<StatutVisite, { libelle: string; ton: "neutre" | "bleu" | "vert" | "ambre" | "rouge" }> = {
  a_faire: { libelle: "À faire", ton: "neutre" },
  en_cours: { libelle: "En cours", ton: "bleu" },
  realisee: { libelle: "Réalisée (confirmée)", ton: "vert" },
  absent: { libelle: "Patient absent", ton: "ambre" },
  reportee: { libelle: "Reportée", ton: "rouge" },
};

export default function Tournee() {
  const { state, dispatch } = useStore();
  const cabinet = useCabinetSelectionne();
  const today = todayISO();
  const demain = addDays(today, 1);
  const [jour, setJour] = useState<"aujourdhui" | "demain">("aujourdhui");
  const date = jour === "aujourdhui" ? today : demain;
  const visites = visitesDuJour(state.visites, cabinet.id, date);
  const [aValider, setAValider] = useState<Visite | null>(null);
  const [actions, setActions] = useState<Visite | null>(null);
  const [ajout, setAjout] = useState(false);
  const [patientAjout, setPatientAjout] = useState("");

  const patient = (id: string) => state.patients.find((p) => p.id === id);
  const faites = visites.filter((v) => v.statut === "realisee").length;
  const traitees = visites.filter((v) => ["realisee", "absent", "reportee"].includes(v.statut)).length;
  const progression = visites.length ? Math.round((traitees / visites.length) * 100) : 0;
  const patientsDispo = state.patients.filter((p) => p.cabinetId === cabinet.id && !visites.some((v) => v.patientId === p.id));

  return (
    <div>
      <div className="mt-2">
        <Segments
          label="Jour de la tournée"
          valeur={jour}
          onChange={setJour}
          options={[
            { valeur: "aujourdhui", libelle: "Aujourd'hui" },
            { valeur: "demain", libelle: "Demain" },
          ]}
        />
      </div>

      <Card className="mt-3">
        <p className="text-sm text-doux">{formatDateLong(date)}</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-xl font-bold">
            {visites.length} visite{visites.length > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-doux">
            {faites} réalisée{faites > 1 ? "s" : ""} · {traitees}/{visites.length} traitées
          </p>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Progression de la tournée"
          aria-valuenow={progression}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-vert-500 transition-all" style={{ width: `${progression}%` }} />
        </div>
      </Card>

      {jour === "demain" && (
        <Card className="mt-3 bg-vert-50">
          <h2 className="font-bold">Préparer la tournée de demain</h2>
          <p className="mt-1 text-sm text-doux">
            Crée automatiquement les visites à partir des patients fictifs actifs de « {cabinet.nom} », triées par horaire. Vous pouvez
            ensuite réordonner, ajouter ou retirer des visites.
          </p>
          <Button
            variante="vert"
            pleineLargeur
            className="mt-3"
            onClick={() => dispatch({ type: "tournee/preparer", cabinetId: cabinet.id, date })}
            disabled={patientsDispo.filter((p) => p.actif).length === 0}
          >
            <Wand2 size={20} aria-hidden /> Préparer automatiquement
          </Button>
        </Card>
      )}

      <div className="mt-3">
        <Avertissement ton="bleu">
          Un soin n’est jamais considéré comme réalisé automatiquement : cochez chaque soin effectué, puis confirmez la visite.
        </Avertissement>
      </div>

      <ol className="mt-3 space-y-3" role="list">
        {visites.length === 0 && (
          <li>
            <Vide>Aucune visite pour ce jour dans ce cabinet.</Vide>
          </li>
        )}
        {visites.map((v, i) => {
          const p = patient(v.patientId);
          const st = statuts[v.statut];
          const terminee = v.statut === "realisee" || v.statut === "absent" || v.statut === "reportee";
          return (
            <li key={v.id}>
              <Card as="article" className={cx(v.statut === "realisee" && "ring-vert-200 bg-vert-50/40")}>
                <div className="flex items-start gap-3">
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-bleu-50 py-2">
                    <span className="text-xs font-semibold text-doux">#{i + 1}</span>
                    <span className="font-bold text-bleu-700">{v.heure}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{p?.prenom ?? "Patient supprimé"}</h3>
                      <Badge ton={st.ton}>{st.libelle}</Badge>
                    </div>
                    <p className="text-xs text-doux">{p?.identifiant}</p>
                    {p && (
                      <a
                        className="mt-1 inline-flex min-h-9 items-center gap-1 text-sm text-bleu-700 underline-offset-2 active:underline"
                        href={`https://maps.apple.com/?q=${encodeURIComponent(p.adresse)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin size={14} aria-hidden /> {p.adresse}
                      </a>
                    )}
                    {p?.notes && <p className="mt-1 text-sm text-doux">📝 {p.notes}</p>}
                  </div>
                  <IconButton label={`Plus d'actions pour ${p?.prenom ?? "cette visite"}`} onClick={() => setActions(v)}>
                    <MoreHorizontal />
                  </IconButton>
                </div>

                <fieldset className="mt-3 space-y-1" disabled={v.statut === "absent" || v.statut === "reportee"}>
                  <legend className="mb-1 text-sm font-semibold">Soins prévus — cochez ceux réalisés</legend>
                  {v.soins.map((s) => (
                    <label key={s} className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-3">
                      <input
                        type="checkbox"
                        className="h-6 w-6 accent-vert-600"
                        checked={v.soinsCoches.includes(s)}
                        onChange={() => dispatch({ type: "visite/basculerSoin", id: v.id, soin: s })}
                      />
                      <span className="text-base">{s}</span>
                    </label>
                  ))}
                </fieldset>

                {!terminee && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {v.statut === "a_faire" ? (
                      <Button variante="secondaire" onClick={() => dispatch({ type: "visite/statut", id: v.id, statut: "en_cours" })}>
                        Commencer
                      </Button>
                    ) : (
                      <Button variante="secondaire" onClick={() => dispatch({ type: "visite/statut", id: v.id, statut: "absent" })}>
                        Absent
                      </Button>
                    )}
                    <Button variante="vert" disabled={!peutEtreValidee(v)} onClick={() => setAValider(v)}>
                      <CheckCircle2 size={20} aria-hidden /> Valider
                    </Button>
                  </div>
                )}
                {!terminee && !peutEtreValidee(v) && (
                  <p className="mt-2 text-xs text-doux">Cochez tous les soins réalisés pour pouvoir valider la visite.</p>
                )}
                {v.statut === "realisee" && v.confirmeeLe && (
                  <p className="mt-2 text-xs text-vert-700">
                    Confirmée par vous à {new Date(v.confirmeeLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                {terminee && (
                  <Button
                    variante="fantome"
                    className="mt-2"
                    onClick={() => dispatch({ type: "visite/statut", id: v.id, statut: "en_cours" })}
                  >
                    Rouvrir la visite
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <Button variante="secondaire" pleineLargeur className="mt-4" onClick={() => setAjout(true)} disabled={patientsDispo.length === 0}>
        <PlusIcon size={20} aria-hidden /> Ajouter une visite
      </Button>

      <Confirmation
        ouverte={aValider !== null}
        titre="Confirmer la visite"
        libelleConfirmer="Je confirme"
        variante="vert"
        onAnnuler={() => setAValider(null)}
        onConfirmer={() => {
          if (aValider) dispatch({ type: "visite/statut", id: aValider.id, statut: "realisee" });
          setAValider(null);
        }}
        message={
          aValider && (
            <>
              <p>
                Confirmez-vous avoir réalisé les soins suivants pour <strong>{patient(aValider.patientId)?.prenom}</strong> (patient fictif) ?
              </p>
              <ul className="mt-2 list-inside list-disc">
                {aValider.soinsCoches.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </>
          )
        }
      />

      <Feuille ouverte={actions !== null} onFermer={() => setActions(null)} titre={`Visite · ${actions ? patient(actions.patientId)?.prenom ?? "" : ""}`}>
        {actions && (
          <div className="grid gap-2">
            <Button
              variante="secondaire"
              disabled={visites[0]?.id === actions.id}
              onClick={() => dispatch({ type: "visite/deplacer", id: actions.id, direction: -1 })}
            >
              <ArrowUp size={20} aria-hidden /> Monter dans la tournée
            </Button>
            <Button
              variante="secondaire"
              disabled={visites[visites.length - 1]?.id === actions.id}
              onClick={() => dispatch({ type: "visite/deplacer", id: actions.id, direction: 1 })}
            >
              <ArrowDown size={20} aria-hidden /> Descendre dans la tournée
            </Button>
            <Button
              variante="secondaire"
              onClick={() => {
                dispatch({ type: "visite/statut", id: actions.id, statut: "absent" });
                setActions(null);
              }}
            >
              Patient absent
            </Button>
            <Button
              variante="secondaire"
              onClick={() => {
                dispatch({ type: "visite/statut", id: actions.id, statut: "reportee" });
                setActions(null);
              }}
            >
              Reporter la visite
            </Button>
            <Button
              variante="danger"
              onClick={() => {
                dispatch({ type: "visite/supprimer", id: actions.id });
                setActions(null);
              }}
            >
              <Trash2 size={20} aria-hidden /> Retirer de la tournée
            </Button>
          </div>
        )}
      </Feuille>

      <Feuille ouverte={ajout} onFermer={() => setAjout(false)} titre="Ajouter une visite">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Patient fictif</span>
            <select className={inputClass} value={patientAjout} onChange={(e) => setPatientAjout(e.target.value)}>
              <option value="">Choisir…</option>
              {patientsDispo.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prenom} · {p.horaire} · {p.identifiant}
                </option>
              ))}
            </select>
          </label>
          <Button
            pleineLargeur
            disabled={!patientAjout}
            onClick={() => {
              dispatch({ type: "visite/ajouter", patientId: patientAjout, date });
              setPatientAjout("");
              setAjout(false);
            }}
          >
            Ajouter à la tournée
          </Button>
        </div>
      </Feuille>
    </div>
  );
}
