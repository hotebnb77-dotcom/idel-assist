"use client";

import { useEffect, useRef, useState } from "react";
import { FileAudio, FlaskConical, Mail, MailOpen, PenLine, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { useCabinetSelectionne, useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/dates";
import { newId, raisonsBlocageValidation, resumerLocalement, simulerTranscription } from "@/lib/logic";
import type { Transmission } from "@/lib/types";
import { Avertissement, Badge, Button, Card, Champ, Feuille, IconButton, Segments, Vide, cx, inputClass } from "../ui";

type Brouillon = {
  id?: string;
  source: "ecrite" | "audio";
  patientId: string;
  texte: string;
  resume: string;
  prioritaire: boolean;
  simulation: boolean;
  nomFichierAudio?: string;
  creeLe?: string;
};

const vide = (): Brouillon => ({ source: "ecrite", patientId: "", texte: "", resume: "", prioritaire: false, simulation: false });

export default function Transmissions() {
  const { state, dispatch } = useStore();
  const cabinet = useCabinetSelectionne();
  const [onglet, setOnglet] = useState<"liste" | "nouvelle">("liste");
  const [filtre, setFiltre] = useState<"toutes" | "non_lues" | "a_valider">("toutes");
  const [b, setB] = useState<Brouillon>(vide);
  const [relu, setRelu] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<"idle" | "encours">("idle");
  const [detail, setDetail] = useState<Transmission | null>(null);
  const [message, setMessage] = useState("");
  const fichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const patients = state.patients.filter((p) => p.cabinetId === cabinet.id);
  const patient = (id?: string) => (id ? state.patients.find((p) => p.id === id) : undefined);
  const liste = state.transmissions
    .filter((t) => t.cabinetId === cabinet.id)
    .filter((t) => (filtre === "non_lues" ? !t.lu : filtre === "a_valider" ? t.statut !== "validee" : true))
    .sort((x, y) => y.creeLe.localeCompare(x.creeLe));

  const blocages = raisonsBlocageValidation(b.texte, relu);

  const reinitForm = () => {
    setB(vide());
    setRelu(false);
    setAudioUrl(null);
    setTranscription("idle");
    if (fichierRef.current) fichierRef.current.value = "";
  };

  const enregistrer = (valider: boolean) => {
    const maintenant = new Date().toISOString();
    const t: Transmission = {
      id: b.id ?? newId("tr"),
      cabinetId: cabinet.id,
      patientId: b.patientId || undefined,
      creeLe: b.creeLe ?? maintenant,
      auteur: "Vous (démo)",
      source: b.source,
      texte: b.texte.trim(),
      resume: b.resume.trim() || undefined,
      simulation: b.simulation,
      nomFichierAudio: b.nomFichierAudio,
      statut: valider ? "validee" : b.texte.trim() ? "a_valider" : "brouillon",
      lu: true,
      prioritaire: b.prioritaire,
      valideeLe: valider ? maintenant : undefined,
    };
    dispatch({ type: "transmission/enregistrer", transmission: t });
    setMessage(valider ? "Transmission validée et enregistrée." : "Brouillon enregistré : il reste à valider.");
    reinitForm();
    setOnglet("liste");
  };

  const reprendre = (t: Transmission) => {
    setB({
      id: t.id,
      source: t.source,
      patientId: t.patientId ?? "",
      texte: t.texte,
      resume: t.resume ?? "",
      prioritaire: t.prioritaire,
      simulation: t.simulation,
      nomFichierAudio: t.nomFichierAudio,
      creeLe: t.creeLe,
    });
    setRelu(false);
    setDetail(null);
    setOnglet("nouvelle");
  };

  return (
    <div>
      <div className="mt-2">
        <Segments
          label="Affichage"
          valeur={onglet}
          onChange={(v) => {
            setOnglet(v);
            setMessage("");
          }}
          options={[
            { valeur: "liste", libelle: "Transmissions" },
            { valeur: "nouvelle", libelle: b.id ? "Relecture" : "Nouvelle" },
          ]}
        />
      </div>

      {message && (
        <p role="status" className="mt-3 rounded-2xl bg-vert-50 p-3 text-sm font-semibold text-vert-700 ring-1 ring-vert-100">
          {message}
        </p>
      )}

      {onglet === "liste" && (
        <>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer">
            {(
              [
                ["toutes", "Toutes"],
                ["non_lues", "Non lues"],
                ["a_valider", "À valider"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={filtre === v}
                onClick={() => setFiltre(v)}
                className={cx(
                  "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ring-1",
                  filtre === v ? "bg-bleu-600 text-white ring-bleu-600" : "bg-white text-doux ring-slate-200",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <ul className="mt-3 space-y-3" role="list">
            {liste.length === 0 && (
              <li>
                <Vide>Aucune transmission ici pour « {cabinet.nom} ».</Vide>
              </li>
            )}
            {liste.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setDetail(t);
                    if (!t.lu) dispatch({ type: "transmission/lue", id: t.id, lu: true });
                  }}
                  className="w-full rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {!t.lu && <span className="h-2.5 w-2.5 rounded-full bg-vert-500" aria-label="Non lue" />}
                    {t.source === "audio" ? <FileAudio size={16} className="text-doux" aria-hidden /> : <PenLine size={16} className="text-doux" aria-hidden />}
                    <span className="flex-1 text-sm font-semibold">{t.auteur}</span>
                    {t.prioritaire && <Badge ton="rouge">Prioritaire</Badge>}
                    {t.simulation && <Badge ton="violet">Simulation</Badge>}
                    {t.statut === "validee" ? <Badge ton="vert">Validée</Badge> : <Badge ton="ambre">À valider</Badge>}
                  </div>
                  {patient(t.patientId) && <p className="mt-1 text-xs text-doux">Patient fictif : {patient(t.patientId)?.prenom}</p>}
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-encre">{t.resume || t.texte}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(t.creeLe)}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {onglet === "nouvelle" && (
        <div className="mt-3 space-y-3">
          <Avertissement>
            <strong>Prototype :</strong> aucune donnée n’est envoyée à un service externe ni à une IA. La transcription et le résumé sont des{" "}
            <strong>simulations locales</strong> clairement signalées. Toute transmission doit être relue et validée par vous.
          </Avertissement>

          <Card className="space-y-3">
            <Segments
              label="Type de transmission"
              valeur={b.source}
              onChange={(source) => setB({ ...b, source })}
              options={[
                { valeur: "ecrite", libelle: "✍️ Écrite" },
                { valeur: "audio", libelle: "🎙️ Audio" },
              ]}
            />

            <Champ label="Patient concerné (optionnel)">
              <select className={inputClass} value={b.patientId} onChange={(e) => setB({ ...b, patientId: e.target.value })}>
                <option value="">— Transmission générale —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.prenom} · {p.identifiant}
                  </option>
                ))}
              </select>
            </Champ>

            {b.source === "audio" && (
              <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
                <input
                  ref={fichierRef}
                  id="fichier-audio"
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (audioUrl) URL.revokeObjectURL(audioUrl);
                    setAudioUrl(URL.createObjectURL(f));
                    setB((x) => ({ ...x, nomFichierAudio: f.name }));
                  }}
                />
                <label
                  htmlFor="fichier-audio"
                  className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-bleu-600 px-4 font-semibold text-white active:bg-bleu-700"
                >
                  <Upload size={20} aria-hidden /> {b.nomFichierAudio ? "Changer de fichier audio" : "Importer un fichier audio"}
                </label>
                <p className="text-xs text-doux">
                  Sur iPhone : enregistrez un mémo dans « Dictaphone », partagez-le vers « Fichiers », puis importez-le ici. Le fichier reste sur
                  votre téléphone : il n’est ni envoyé, ni analysé, ni conservé après fermeture.
                </p>
                {b.nomFichierAudio && (
                  <>
                    <p className="text-sm">
                      <FileAudio size={16} className="mr-1 inline" aria-hidden />
                      {b.nomFichierAudio}
                    </p>
                    {audioUrl && <audio controls src={audioUrl} className="w-full" />}
                    <Button
                      variante="secondaire"
                      pleineLargeur
                      disabled={transcription === "encours"}
                      onClick={() => {
                        setTranscription("encours");
                        window.setTimeout(() => {
                          setB((x) => ({ ...x, texte: simulerTranscription(x.nomFichierAudio ?? "audio"), simulation: true }));
                          setRelu(false);
                          setTranscription("idle");
                        }, 900);
                      }}
                    >
                      <FlaskConical size={20} aria-hidden />
                      {transcription === "encours" ? "Simulation en cours…" : "Simuler la transcription"}
                    </Button>
                  </>
                )}
              </div>
            )}

            <Champ
              label={b.source === "audio" ? "Texte de la transmission (à réécrire après écoute)" : "Texte de la transmission"}
              aide="N’écrivez que des informations fictives dans cette démonstration."
            >
              <textarea
                className={cx(inputClass, "min-h-40")}
                value={b.texte}
                onChange={(e) => {
                  setB({ ...b, texte: e.target.value });
                  setRelu(false);
                }}
                placeholder="Ex. (fictif) : clé chez la gardienne, passage décalé à 9h…"
              />
            </Champ>
            {b.simulation && (
              <p className="flex items-center gap-1 text-xs font-semibold text-violet-700">
                <FlaskConical size={14} aria-hidden /> Ce texte contient une partie simulée : à réécrire et vérifier.
              </p>
            )}

            <div className="space-y-2">
              <Button
                variante="secondaire"
                pleineLargeur
                disabled={!b.texte.trim()}
                onClick={() => setB({ ...b, resume: resumerLocalement(b.texte), simulation: true })}
              >
                <Sparkles size={20} aria-hidden /> Générer un résumé (simulation locale)
              </Button>
              {b.resume !== "" && (
                <Champ label="Résumé — simulation : extrait de vos propres phrases, à vérifier">
                  <textarea
                    className={cx(inputClass, "min-h-24")}
                    value={b.resume}
                    onChange={(e) => {
                      setB({ ...b, resume: e.target.value });
                      setRelu(false);
                    }}
                  />
                </Champ>
              )}
            </div>

            <label className="flex min-h-12 items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-rose-600" checked={b.prioritaire} onChange={(e) => setB({ ...b, prioritaire: e.target.checked })} />
              <span>Marquer comme prioritaire</span>
            </label>
          </Card>

          <Card className="space-y-3 bg-vert-50">
            <h2 className="flex items-center gap-2 font-bold">
              <ShieldCheck size={20} className="text-vert-700" aria-hidden /> Validation humaine obligatoire
            </h2>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-vert-600" checked={relu} onChange={(e) => setRelu(e.target.checked)} />
              <span className="text-sm">
                J’ai relu intégralement le texte et le résumé. Ils ne contiennent que ce que j’ai moi-même constaté ou décidé, et aucune donnée
                réelle.
              </span>
            </label>
            {blocages.length > 0 && b.texte.trim() !== "" && (
              <ul className="list-inside list-disc text-xs text-amber-900">
                {blocages.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <Button variante="vert" pleineLargeur disabled={blocages.length > 0} onClick={() => enregistrer(true)}>
              <ShieldCheck size={20} aria-hidden /> Valider et enregistrer
            </Button>
            <Button variante="secondaire" pleineLargeur disabled={!b.texte.trim()} onClick={() => enregistrer(false)}>
              Enregistrer comme « à valider »
            </Button>
            {(b.id || b.texte) && (
              <Button variante="fantome" pleineLargeur onClick={reinitForm}>
                Abandonner
              </Button>
            )}
          </Card>
        </div>
      )}

      <Feuille ouverte={detail !== null} onFermer={() => setDetail(null)} titre="Transmission">
        {detail && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {detail.statut === "validee" ? <Badge ton="vert">Validée</Badge> : <Badge ton="ambre">À valider</Badge>}
              {detail.simulation && <Badge ton="violet">Contient une simulation</Badge>}
              {detail.prioritaire && <Badge ton="rouge">Prioritaire</Badge>}
            </div>
            <p className="text-sm text-doux">
              {detail.auteur} · {formatDateTime(detail.creeLe)}
              {patient(detail.patientId) && ` · Patient fictif : ${patient(detail.patientId)?.prenom}`}
            </p>
            {detail.nomFichierAudio && <p className="text-sm text-doux">Audio d’origine : {detail.nomFichierAudio} (non conservé)</p>}
            {detail.resume && (
              <div className="rounded-2xl bg-violet-50 p-3 text-sm">
                <p className="font-semibold text-violet-800">Résumé (simulation, vérifié par l’autrice)</p>
                <p className="mt-1 whitespace-pre-line">{detail.resume}</p>
              </div>
            )}
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-base">{detail.texte}</p>
            {detail.statut !== "validee" && (
              <Button variante="vert" pleineLargeur onClick={() => reprendre(detail)}>
                <ShieldCheck size={20} aria-hidden /> Relire et valider
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variante="secondaire"
                className="flex-1"
                onClick={() => {
                  dispatch({ type: "transmission/lue", id: detail.id, lu: false });
                  setDetail(null);
                }}
              >
                <Mail size={18} aria-hidden /> Marquer non lue
              </Button>
              <IconButton
                label="Supprimer la transmission"
                className="bg-rose-50 text-rose-700"
                onClick={() => {
                  dispatch({ type: "transmission/supprimer", id: detail.id });
                  setDetail(null);
                }}
              >
                <Trash2 size={20} />
              </IconButton>
            </div>
            <p className="flex items-center gap-1 text-xs text-doux">
              <MailOpen size={14} aria-hidden /> Ouvrir une transmission la marque comme lue.
            </p>
          </div>
        )}
      </Feuille>
    </div>
  );
}
