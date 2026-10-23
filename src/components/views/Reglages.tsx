"use client";

import { useState } from "react";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import { Avertissement, Button, Card, Champ, Confirmation, TitreSection, inputClass } from "../ui";

export default function Reglages() {
  const { state, dispatch, sauvegardeDisponible } = useStore();
  const [confirmer, setConfirmer] = useState(false);
  const [fait, setFait] = useState(false);

  return (
    <div>
      <Card className="mt-2 space-y-3">
        <h2 className="text-lg font-bold">Données de démonstration</h2>
        <p className="text-sm text-doux">
          {sauvegardeDisponible
            ? "Vos modifications sont sauvegardées automatiquement sur ce téléphone (stockage local du navigateur). Rien n’est envoyé sur internet."
            : "La sauvegarde locale n’est pas disponible (navigation privée ?). Les modifications seront perdues à la fermeture."}
        </p>
        <Button variante="danger" pleineLargeur onClick={() => setConfirmer(true)}>
          <RotateCcw size={20} aria-hidden /> Réinitialiser les données fictives
        </Button>
        {fait && (
          <p role="status" className="text-sm font-semibold text-vert-700">
            Données fictives réinitialisées.
          </p>
        )}
      </Card>

      <TitreSection>Profil (démo)</TitreSection>
      <Card>
        <Champ label="Prénom affiché sur l’accueil">
          <input
            className={inputClass}
            value={state.parametres.prenomUtilisatrice}
            onChange={(e) => dispatch({ type: "parametres/prenom", prenom: e.target.value })}
          />
        </Champ>
      </Card>

      <TitreSection>Avertissements importants</TitreSection>
      <Card className="space-y-3 text-sm">
        <p className="flex items-start gap-2 font-semibold text-rose-800">
          <ShieldAlert className="shrink-0" size={20} aria-hidden />
          Ce prototype n’est pas conforme HDS et n’est pas prêt pour un usage médical réel.
        </p>
        <ul className="list-inside list-disc space-y-1 text-doux">
          <li>Utilisez uniquement des données fictives : aucun nom réel, aucune donnée de santé réelle.</li>
          <li>Aucun service d’IA externe n’est appelé. Transcription et résumé sont des simulations locales signalées.</li>
          <li>Aucun soin n’est marqué réalisé sans votre confirmation explicite.</li>
          <li>Les calculs financiers sont indicatifs.</li>
        </ul>
        <Avertissement ton="bleu">
          Avant un usage réel il faudra notamment : un hébergement certifié HDS, une authentification forte, le chiffrement, une analyse
          d’impact (RGPD), et une transcription sécurisée avec validation humaine.
        </Avertissement>
        <p className="text-xs text-slate-400">IDEL Assist · version de démonstration 0.1</p>
      </Card>

      <Confirmation
        ouverte={confirmer}
        titre="Réinitialiser la démo ?"
        variante="danger"
        libelleConfirmer="Réinitialiser"
        onAnnuler={() => setConfirmer(false)}
        onConfirmer={() => {
          dispatch({ type: "reinitialiser", today: todayISO() });
          setConfirmer(false);
          setFait(true);
        }}
        message={<p>Toutes vos modifications seront effacées et les données fictives d’origine seront restaurées (dates recalées sur aujourd’hui).</p>}
      />
    </div>
  );
}
