"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, ChevronRight, Clock, MessageSquareText, Plus as PlusIcon, Star, Trash2 } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { formatDateLong, formatDateShort, formatDateTime, todayISO } from "@/lib/dates";
import { detecterConflits, prochainesVisites, transmissionsNonLues, visitesDuJour } from "@/lib/logic";
import { Badge, Card, IconButton, Pastille, TitreSection, Vide, couleurs, cx, inputClass } from "../ui";
import type { Aller } from "../AppShell";

export default function Accueil({ aller }: { aller: Aller }) {
  const { state, dispatch } = useStore();
  const cabinet = useCabinetSelectionne();
  const today = todayISO();
  const heure = new Date().getHours();
  const salut = heure < 18 ? "Bonjour" : "Bonsoir";

  const duJour = visitesDuJour(state.visites, cabinet.id, today);
  const realisees = duJour.filter((v) => v.statut === "realisee").length;
  const prochaines = prochainesVisites(state.visites, cabinet.id, today);
  const nonLues = transmissionsNonLues(state.transmissions, cabinet.id);
  const conflits = detecterConflits(state.remplacements, state.indisponibilites).filter((c) => c.date >= today);
  const remplacementDuJour = state.remplacements.find((r) => r.date === today && r.cabinetId === cabinet.id && r.statut !== "annule");
  const taches = state.taches
    .filter((t) => !t.cabinetId || t.cabinetId === cabinet.id)
    .sort((a, b) => Number(a.faite) - Number(b.faite) || Number(b.importante) - Number(a.importante));

  const [nouvelleTache, setNouvelleTache] = useState("");
  const [importante, setImportante] = useState(true);
  const patient = (id: string) => state.patients.find((p) => p.id === id);

  return (
    <div>
      <Card className={cx("mt-2", couleurs[cabinet.couleur].fond)}>
        <p className="text-sm text-doux">{formatDateLong(today)}</p>
        <p className="mt-1 text-2xl font-bold">
          {salut} {state.parametres.prenomUtilisatrice} 👋
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Pastille couleur={cabinet.couleur} />
          <span className="font-semibold">{cabinet.nom}</span>
          <span className="text-doux">· {cabinet.ville}</span>
        </p>
        <p className="mt-1 text-sm text-doux">
          {remplacementDuJour
            ? `Remplacement aujourd'hui de ${remplacementDuJour.debut} à ${remplacementDuJour.fin}`
            : "Pas de remplacement prévu aujourd'hui dans ce cabinet"}
        </p>
      </Card>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <button type="button" onClick={() => aller("tournee")} className="rounded-3xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100">
          <Clock className="text-bleu-600" size={20} aria-hidden />
          <p className="mt-1 text-2xl font-bold">
            {realisees}/{duJour.length}
          </p>
          <p className="text-xs text-doux">visites du jour</p>
        </button>
        <button type="button" onClick={() => aller("transmissions")} className="rounded-3xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100">
          <MessageSquareText className="text-vert-600" size={20} aria-hidden />
          <p className="mt-1 text-2xl font-bold">{nonLues.length}</p>
          <p className="text-xs text-doux">non lues</p>
        </button>
        <button type="button" onClick={() => aller("planning")} className="rounded-3xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100">
          <AlertTriangle className={conflits.length ? "text-rose-600" : "text-slate-400"} size={20} aria-hidden />
          <p className="mt-1 text-2xl font-bold">{conflits.length}</p>
          <p className="text-xs text-doux">conflits</p>
        </button>
      </div>

      {conflits.length > 0 && (
        <button
          type="button"
          onClick={() => aller("planning")}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-rose-50 p-3 text-left text-sm text-rose-800 ring-1 ring-rose-200"
        >
          <AlertTriangle size={20} aria-hidden />
          <span className="flex-1">
            Conflit de planning le <strong>{formatDateShort(conflits[0].date)}</strong>
            {conflits.length > 1 && ` (+${conflits.length - 1} autre${conflits.length > 2 ? "s" : ""})`}
          </span>
          <ChevronRight size={18} aria-hidden />
        </button>
      )}

      <TitreSection
        action={
          <button type="button" className="min-h-11 px-2 text-sm font-semibold text-bleu-700" onClick={() => aller("tournee")}>
            Voir la tournée
          </button>
        }
      >
        Prochaines visites
      </TitreSection>
      {prochaines.length === 0 ? (
        <Vide>{duJour.length ? "Toutes les visites du jour sont traitées 🎉" : "Aucune visite prévue aujourd'hui pour ce cabinet."}</Vide>
      ) : (
        <ul className="space-y-2" role="list">
          {prochaines.map((v) => (
            <li key={v.id}>
              <Card as="div" className="flex items-center gap-3">
                <div className="flex h-12 w-14 flex-col items-center justify-center rounded-2xl bg-bleu-50 font-bold text-bleu-700">{v.heure}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{patient(v.patientId)?.prenom ?? "Patient supprimé"}</p>
                  <p className="truncate text-sm text-doux">{v.soins.join(" · ")}</p>
                </div>
                {v.statut === "en_cours" && <Badge ton="bleu">En cours</Badge>}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <TitreSection
        action={
          <button type="button" className="min-h-11 px-2 text-sm font-semibold text-bleu-700" onClick={() => aller("transmissions")}>
            Tout voir
          </button>
        }
      >
        Transmissions non lues
      </TitreSection>
      {nonLues.length === 0 ? (
        <Vide>Aucune transmission non lue.</Vide>
      ) : (
        <ul className="space-y-2" role="list">
          {nonLues.slice(0, 3).map((t) => (
            <li key={t.id}>
              <Card as="div">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-vert-500" aria-hidden />
                  <p className="flex-1 text-sm font-semibold">{t.auteur}</p>
                  {t.prioritaire && <Badge ton="rouge">Prioritaire</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-doux">{t.resume || t.texte}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{formatDateTime(t.creeLe)}</span>
                  <button
                    type="button"
                    className="min-h-11 px-2 text-sm font-semibold text-vert-700"
                    onClick={() => dispatch({ type: "transmission/lue", id: t.id, lu: true })}
                  >
                    Marquer comme lue
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <TitreSection>Tâches importantes</TitreSection>
      <Card>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: "tache/ajouter", titre: nouvelleTache, importante, cabinetId: cabinet.id });
            setNouvelleTache("");
          }}
        >
          <label className="sr-only" htmlFor="nouvelle-tache">
            Nouvelle tâche
          </label>
          <input
            id="nouvelle-tache"
            className={inputClass}
            placeholder="Ajouter une tâche…"
            value={nouvelleTache}
            onChange={(e) => setNouvelleTache(e.target.value)}
          />
          <IconButton
            label={importante ? "Tâche importante (activé)" : "Tâche importante (désactivé)"}
            aria-pressed={importante}
            onClick={() => setImportante(!importante)}
            className={importante ? "text-amber-500" : ""}
          >
            <Star size={22} fill={importante ? "currentColor" : "none"} />
          </IconButton>
          <IconButton label="Ajouter la tâche" type="submit" className="bg-bleu-600 text-white active:bg-bleu-700" disabled={!nouvelleTache.trim()}>
            <PlusIcon size={22} />
          </IconButton>
        </form>
        {taches.length === 0 ? (
          <p className="mt-3 text-sm text-doux">Aucune tâche.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100" role="list">
            {taches.map((t) => (
              <li key={t.id} className="flex items-center gap-2 py-1">
                <label className="flex min-h-12 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-6 w-6 shrink-0 accent-vert-600"
                    checked={t.faite}
                    onChange={() => dispatch({ type: "tache/basculer", id: t.id })}
                  />
                  <span className={cx("text-sm", t.faite && "text-slate-400 line-through")}>
                    {t.titre}
                    {t.echeance && <span className="block text-xs text-doux">Échéance : {formatDateShort(t.echeance)}</span>}
                  </span>
                </label>
                {t.importante && !t.faite && <Star size={16} className="text-amber-500" fill="currentColor" aria-label="Importante" />}
                <IconButton label={`Supprimer la tâche ${t.titre}`} onClick={() => dispatch({ type: "tache/supprimer", id: t.id })}>
                  <Trash2 size={18} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <button
        type="button"
        onClick={() => aller("planning")}
        className="mt-4 flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100"
      >
        <CalendarDays className="text-bleu-600" aria-hidden />
        <span className="flex-1 font-semibold">Ouvrir le planning des remplacements</span>
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}
