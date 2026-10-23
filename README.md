# IDEL Assist — prototype de démonstration

Application mobile (PWA installable sur iPhone) pour infirmière libérale remplaçante.

> ⚠️ **Prototype de démonstration.** Données **100 % fictives**. Non conforme HDS, pas prêt pour un usage médical réel.
> Aucun appel à un service d'IA externe. Transcription et résumé = **simulations locales** clairement signalées.

## Modules
- **Accueil** : date, cabinet sélectionné, visites du jour, prochaines visites, transmissions non lues, tâches importantes.
- **Cabinets** : créer, modifier, sélectionner, supprimer (chaque cabinet a son planning, ses patients, ses transmissions).
- **Planning** : calendrier mensuel, statut des journées (prévu / effectué / annulé), indisponibilités, alertes de conflit.
- **Patients** : fiches fictives, recherche (sans accents), filtres par cabinet.
- **Tournée** : visites ordonnées, cases à cocher par soin, validation **uniquement après confirmation**, préparation du lendemain.
- **Transmissions** : saisie écrite, import audio (reste sur le téléphone), transcription/résumé simulés, **validation humaine obligatoire**.
- **Finances** : jours travaillés, km, rétrocessions et indemnités km (indicatif).
- **Réglages** : réinitialiser les données fictives, avertissements.

Sauvegarde automatique dans le stockage local du navigateur (`localStorage`).

## Technique
Next.js 16 (export statique), React 19, TypeScript, Tailwind CSS 4, Vitest + Testing Library.

```bash
npm install
npm run dev        # développement
npm test           # tests
npm run build      # build statique dans out/
npm run check      # typecheck + tests + build
node scripts/generer-icones.mjs   # régénérer les icônes
```

Structure : `src/lib` (modèle, données fictives, logique métier, réducteur, sauvegarde), `src/components` (interface), `tests/`.

## Déploiement
Export statique : déployable sur Vercel (import du dépôt GitHub, aucun réglage), Netlify, etc.
Le site demande aux moteurs de recherche de ne pas l'indexer (`noindex` + `robots.txt`).

## Avant tout usage réel (à faire)
Hébergement certifié HDS, authentification forte, chiffrement, AIPD/RGPD, transcription sécurisée hébergée HDS avec validation humaine, journalisation, sauvegardes, synchronisation multi-appareils.
