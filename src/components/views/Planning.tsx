"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Ban, ChevronLeft, ChevronRight, Plus as PlusIcon, Trash2 } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { addMonths, formatDateLong, formatDateShort, formatMonth, monthGrid, monthKey, todayISO } from "@/lib/dates";
import { datesEnConflit, detecterConflits, newId } from "@/lib/logic";
import type { ISODate, Remplacement, StatutRemplacement } from "@/lib/types";
import { Avertissement, Badge, Button, Card, Champ, Feuille, IconButton, Pastille, Segments, TitreSection, cx, inputClass } from "../ui";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];
const libelleStatut: Record<StatutRemplacement, string> = { prevu: "Prévu", effectue: "Effectué", annule: "Annulé" };
const tonStatut = { prevu: "bleu", effectue: "vert", annule: "neutre" } as const;

export default function Planning() {
  const { state, dispatch } = useStore();
  const cabinetSel = useCabinetSelectionne();
  const today = todayISO();
  const [mois, setMois] = useState(monthKey(today));
  const [jour, setJour] = useState<ISODate | null>(null);
  const [form, setForm] = useState({ cabinetId: cabinetSel.id, debut: "07:00", fin: "13:00", kmTournee: 25 });

  const conflits = useMemo(() => detecterConflits(state.remplacements, state.indisponibilites), [state.remplacements, state.indisponibilites]);
  const enConflit = datesEnConflit(conflits);
  const indispo = new Set(state.indisponibilites);
  const cabinet = (id: string) => state.cabinets.find((c) => c.id === id);
  const parJour = (d: ISODate) => state.remplacements.filter((r) => r.date === d && r.statut !== "annule");

  const duMois = state.remplacements.filter((r) => monthKey(r.date) === mois);
  const travailles = duMois.filter((r) => r.statut === "effectue").length;
  const prevus = duMois.filter((r) => r.statut === "prevu").length;
  const conflitsAVenir = conflits.filter((c) => c.date >= today);

  const ouvrirJour = (d: ISODate) => {
    setForm((f) => ({ ...f, cabinetId: cabinetSel.id }));
    setJour(d);
  };

  const ajouter = () => {
    if (!jour) return;
    const r: Remplacement = { id: newId("rem"), date: jour, statut: "prevu", ...form };
    dispatch({ type: "remplacement/enregistrer", remplacement: r });
  };

  const remplacementsJour = jour ? state.remplacements.filter((r) => r.date === jour).sort((a, b) => a.debut.localeCompare(b.debut)) : [];
  const conflitsJour = jour ? conflits.filter((c) => c.date === jour) : [];

  return (
    <div>
      {conflitsAVenir.length > 0 && (
        <div role="alert" className="mt-2 space-y-2">
          {conflitsAVenir.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setMois(monthKey(c.date));
                ouvrirJour(c.date);
              }}
              className="flex w-full items-start gap-3 rounded-2xl bg-rose-50 p-3 text-left text-sm text-rose-800 ring-1 ring-rose-200"
            >
              <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                <strong>{formatDateShort(c.date)} : </strong>
                {c.type === "chevauchement"
                  ? `deux remplacements se chevauchent (${c.remplacementIds.map((id) => cabinet(state.remplacements.find((r) => r.id === id)?.cabinetId ?? "")?.nom).join(" / ")}).`
                  : "remplacement prévu un jour où vous êtes indisponible."}
              </span>
            </button>
          ))}
        </div>
      )}

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
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-doux" aria-hidden>
          {JOURS.map((j, i) => (
            <span key={i}>{j}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid(mois).map((d, i) => {
            if (!d) return <span key={i} />;
            const rs = parJour(d);
            const conflit = enConflit.has(d);
            const estIndispo = indispo.has(d);
            const libelle = [
              formatDateLong(d),
              rs.length ? `${rs.length} remplacement${rs.length > 1 ? "s" : ""}` : "aucun remplacement",
              estIndispo ? "indisponible" : "",
              conflit ? "conflit" : "",
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <button
                key={d}
                type="button"
                onClick={() => ouvrirJour(d)}
                aria-label={libelle}
                className={cx(
                  "relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold",
                  d === today ? "bg-bleu-600 text-white" : "bg-slate-50 text-encre",
                  estIndispo && d !== today && "case-indispo text-slate-400",
                  conflit && "ring-2 ring-rose-500",
                )}
              >
                {Number(d.slice(8))}
                <span className="mt-0.5 flex h-2 gap-0.5">
                  {rs.slice(0, 3).map((r) => {
                    const c = cabinet(r.cabinetId);
                    return c ? <Pastille key={r.id} couleur={c.couleur} className="h-1.5 w-1.5" /> : null;
                  })}
                </span>
              </button>
            );
          })}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-doux" aria-label="Légende">
          {state.cabinets.map((c) => (
            <li key={c.id} className="flex items-center gap-1.5">
              <Pastille couleur={c.couleur} className="h-2 w-2" /> {c.nom}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="case-indispo inline-block h-3 w-3 rounded" /> Indisponible
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded ring-2 ring-rose-500" /> Conflit
          </li>
        </ul>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-2xl font-bold text-vert-700">{travailles}</p>
          <p className="text-sm text-doux">jours travaillés ce mois</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-bleu-700">{prevus}</p>
          <p className="text-sm text-doux">jours prévus ce mois</p>
        </Card>
      </div>

      <TitreSection>Remplacements du mois</TitreSection>
      <ul className="space-y-2" role="list">
        {duMois
          .sort((a, b) => a.date.localeCompare(b.date) || a.debut.localeCompare(b.debut))
          .map((r) => {
            const c = cabinet(r.cabinetId);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => ouvrirJour(r.date)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1",
                    enConflit.has(r.date) && r.statut !== "annule" ? "ring-rose-300" : "ring-slate-100",
                  )}
                >
                  {c && <Pastille couleur={c.couleur} />}
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{formatDateShort(r.date)}</span>
                    <span className="block text-xs text-doux">
                      {c?.nom} · {r.debut}–{r.fin}
                    </span>
                  </span>
                  <Badge ton={tonStatut[r.statut]}>{libelleStatut[r.statut]}</Badge>
                </button>
              </li>
            );
          })}
        {duMois.length === 0 && <p className="text-sm text-doux">Aucun remplacement ce mois-ci.</p>}
      </ul>

      <Feuille ouverte={jour !== null} onFermer={() => setJour(null)} titre={jour ? formatDateLong(jour) : ""}>
        {jour && (
          <div className="space-y-4">
            {conflitsJour.length > 0 && (
              <Avertissement ton="rouge">
                <strong>Conflit :</strong>{" "}
                {conflitsJour.some((c) => c.type === "chevauchement") && "des remplacements se chevauchent. "}
                {conflitsJour.some((c) => c.type === "indisponible") && "vous êtes marquée indisponible ce jour. "}
                Annulez ou modifiez un remplacement pour résoudre le conflit.
              </Avertissement>
            )}

            <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-50 px-4">
              <Ban size={20} className="text-doux" aria-hidden />
              <span className="flex-1 font-semibold">Je suis indisponible ce jour</span>
              <input
                type="checkbox"
                role="switch"
                className="h-6 w-6 accent-rose-600"
                checked={indispo.has(jour)}
                onChange={() => dispatch({ type: "indisponibilite/basculer", date: jour })}
              />
            </label>

            {remplacementsJour.length > 0 && (
              <ul className="space-y-2" role="list">
                {remplacementsJour.map((r) => {
                  const c = cabinet(r.cabinetId);
                  return (
                    <li key={r.id} className="rounded-2xl p-3 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2">
                        {c && <Pastille couleur={c.couleur} />}
                        <span className="flex-1 font-semibold">{c?.nom}</span>
                        <IconButton label="Supprimer ce remplacement" onClick={() => dispatch({ type: "remplacement/supprimer", id: r.id })}>
                          <Trash2 size={18} />
                        </IconButton>
                      </div>
                      <p className="text-sm text-doux">
                        {r.debut}–{r.fin} · tournée {r.kmTournee} km (fictif)
                      </p>
                      <div className="mt-2">
                        <Segments<StatutRemplacement>
                          label="Statut du remplacement"
                          valeur={r.statut}
                          onChange={(statut) => dispatch({ type: "remplacement/statut", id: r.id, statut })}
                          options={[
                            { valeur: "prevu", libelle: "Prévu" },
                            { valeur: "effectue", libelle: "Effectué" },
                            { valeur: "annule", libelle: "Annulé" },
                          ]}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="space-y-3 rounded-2xl bg-bleu-50 p-4">
              <h3 className="font-bold">Ajouter un remplacement</h3>
              <Champ label="Cabinet">
                <select className={inputClass} value={form.cabinetId} onChange={(e) => setForm({ ...form, cabinetId: e.target.value })}>
                  {state.cabinets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </Champ>
              <div className="grid grid-cols-2 gap-3">
                <Champ label="Début">
                  <input type="time" className={inputClass} value={form.debut} onChange={(e) => setForm({ ...form, debut: e.target.value })} />
                </Champ>
                <Champ label="Fin">
                  <input type="time" className={inputClass} value={form.fin} onChange={(e) => setForm({ ...form, fin: e.target.value })} />
                </Champ>
              </div>
              <Champ label="Km de tournée (estimation)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={inputClass}
                  value={form.kmTournee}
                  onChange={(e) => setForm({ ...form, kmTournee: Math.max(0, Number(e.target.value) || 0) })}
                />
              </Champ>
              {form.debut >= form.fin && <p className="text-sm text-rose-700">L’heure de fin doit être après l’heure de début.</p>}
              <Button pleineLargeur onClick={ajouter} disabled={form.debut >= form.fin}>
                <PlusIcon size={20} aria-hidden /> Ajouter
              </Button>
            </div>
          </div>
        )}
      </Feuille>
    </div>
  );
}
