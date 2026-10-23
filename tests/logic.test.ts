import { describe, expect, it } from "vitest";
import { addDays, addMonths, monthGrid } from "@/lib/dates";
import { creerEtatDemo } from "@/lib/demo-data";
import {
  calculerFinances,
  deplacerVisite,
  detecterConflits,
  peutEtreValidee,
  peutValiderTransmission,
  preparerTournee,
  prochainIdentifiant,
  rechercherPatients,
  resumerLocalement,
  simulerTranscription,
  visitesDuJour,
} from "@/lib/logic";
import type { Remplacement } from "@/lib/types";

const TODAY = "2026-10-23";
const r = (id: string, cabinetId: string, date: string, debut: string, fin: string, statut: Remplacement["statut"] = "prevu"): Remplacement => ({
  id, cabinetId, date, debut, fin, statut, kmTournee: 10,
});

describe("dates", () => {
  it("additionne des jours et des mois en changeant d'année", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });
  it("construit une grille de mois commençant le lundi", () => {
    const g = monthGrid("2026-10"); // 1er octobre 2026 = jeudi
    expect(g.length % 7).toBe(0);
    expect(g.slice(0, 3)).toEqual([null, null, null]);
    expect(g[3]).toBe("2026-10-01");
  });
});

describe("conflits de planning", () => {
  it("détecte un chevauchement le même jour", () => {
    const c = detecterConflits([r("a", "x", TODAY, "07:00", "12:00"), r("b", "y", TODAY, "11:00", "14:00")], []);
    expect(c).toHaveLength(1);
    expect(c[0].type).toBe("chevauchement");
  });
  it("ignore des plages qui se suivent et les remplacements annulés", () => {
    expect(detecterConflits([r("a", "x", TODAY, "07:00", "12:00"), r("b", "y", TODAY, "12:00", "14:00")], [])).toHaveLength(0);
    expect(detecterConflits([r("a", "x", TODAY, "07:00", "12:00"), r("b", "y", TODAY, "08:00", "14:00", "annule")], [])).toHaveLength(0);
  });
  it("signale un remplacement un jour d'indisponibilité", () => {
    const c = detecterConflits([r("a", "x", TODAY, "07:00", "12:00")], [TODAY]);
    expect(c).toEqual([{ type: "indisponible", date: TODAY, remplacementIds: ["a"] }]);
  });
  it("les données de démo contiennent des conflits volontaires", () => {
    const s = creerEtatDemo(TODAY);
    const c = detecterConflits(s.remplacements, s.indisponibilites);
    expect(c.some((x) => x.type === "chevauchement")).toBe(true);
    expect(c.some((x) => x.type === "indisponible")).toBe(true);
  });
});

describe("finances", () => {
  it("calcule jours, km, rétrocession et indemnités à partir des journées effectuées", () => {
    const s = creerEtatDemo(TODAY);
    const cab = s.cabinets[0];
    const state = {
      cabinets: [cab],
      parametres: { ...s.parametres, prixKm: 0.5 },
      remplacements: [
        r("1", cab.id, "2026-10-01", "07:00", "12:00", "effectue"),
        r("2", cab.id, "2026-10-02", "07:00", "12:00", "effectue"),
        r("3", cab.id, "2026-10-03", "07:00", "12:00", "prevu"),
        r("4", cab.id, "2026-09-30", "07:00", "12:00", "effectue"),
      ],
    };
    const b = calculerFinances(state, "2026-10");
    expect(b.totalJours).toBe(2);
    expect(b.totalKm).toBe(2 * (cab.kmTrajet + 10));
    expect(b.totalHonoraires).toBe(2 * cab.honorairesJourMoyen);
    expect(b.totalRetrocession).toBe((2 * cab.honorairesJourMoyen * cab.tauxRetrocession) / 100);
    expect(b.lignes[0].partTitulaire).toBe(b.totalHonoraires - b.totalRetrocession);
    expect(b.totalIndemnitesKm).toBe(b.totalKm * 0.5);
  });
});

describe("tournées", () => {
  const s = creerEtatDemo(TODAY);
  it("les visites de démo ne sont jamais pré-validées", () => {
    expect(s.visites.every((v) => v.statut === "a_faire" && v.soinsCoches.length === 0)).toBe(true);
  });
  it("prépare la tournée du lendemain sans doublon, triée par horaire", () => {
    const demain = addDays(TODAY, 1);
    const v1 = preparerTournee(s.patients, s.visites, "cab-oliviers", demain);
    expect(v1.length).toBe(s.patients.filter((p) => p.cabinetId === "cab-oliviers").length);
    expect(v1.map((v) => v.heure)).toEqual([...v1.map((v) => v.heure)].sort());
    expect(preparerTournee(s.patients, [...s.visites, ...v1], "cab-oliviers", demain)).toHaveLength(0);
  });
  it("réordonne les visites", () => {
    const jour = visitesDuJour(s.visites, "cab-oliviers", TODAY);
    const apres = visitesDuJour(deplacerVisite(s.visites, jour[1].id, -1), "cab-oliviers", TODAY);
    expect(apres[0].id).toBe(jour[1].id);
    expect(apres[1].id).toBe(jour[0].id);
  });
  it("une visite n'est validable que si tous les soins sont cochés", () => {
    const v = s.visites.find((x) => x.soins.length === 2)!;
    expect(peutEtreValidee(v)).toBe(false);
    expect(peutEtreValidee({ ...v, soinsCoches: [v.soins[0]] })).toBe(false);
    expect(peutEtreValidee({ ...v, soinsCoches: [...v.soins] })).toBe(true);
  });
});

describe("transmissions simulées", () => {
  it("la transcription simulée est clairement signalée et n'invente aucune observation", () => {
    const t = simulerTranscription("memo.m4a");
    expect(t).toContain("[SIMULATION]");
    expect(t).toContain("ne contient aucune observation clinique");
    expect(peutValiderTransmission({ texte: t }, true)).toBe(false);
  });
  it("le résumé n'est qu'un extrait des phrases écrites", () => {
    const texte = "Clé chez la gardienne. Passage à 9h demain. Penser au parking.";
    const res = resumerLocalement(texte);
    expect(res).toBe("Clé chez la gardienne. Passage à 9h demain.");
    expect(texte.startsWith(res)).toBe(true);
    expect(resumerLocalement("")).toBe("");
  });
  it("la validation exige une relecture humaine", () => {
    expect(peutValiderTransmission({ texte: "Texte relu." }, false)).toBe(false);
    expect(peutValiderTransmission({ texte: "Texte relu." }, true)).toBe(true);
    expect(peutValiderTransmission({ texte: "   " }, true)).toBe(false);
  });
});

describe("patients", () => {
  const s = creerEtatDemo(TODAY);
  it("recherche sans tenir compte des accents ni de la casse, filtre par cabinet", () => {
    expect(rechercherPatients(s.patients, "rene", "tous").map((p) => p.prenom)).toEqual(["René"]);
    expect(rechercherPatients(s.patients, "", "cab-mimosas")).toHaveLength(3);
    expect(rechercherPatients(s.patients, "glycémie", "cab-oliviers").length).toBeGreaterThan(0);
  });
  it("génère un identifiant fictif suivant", () => {
    expect(prochainIdentifiant(s.patients, s.cabinets[0])).toBe("DEMO-OLI-007");
  });
  it("aucune donnée de démo ne ressemble à un numéro de sécurité sociale", () => {
    const json = JSON.stringify(s);
    expect(json).not.toMatch(/\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\b/);
  });
});
