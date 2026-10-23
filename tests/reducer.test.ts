import { describe, expect, it } from "vitest";
import { creerEtatDemo } from "@/lib/demo-data";
import { reducer } from "@/lib/reducer";

const TODAY = "2026-10-23";

describe("réducteur", () => {
  it("refuse de valider une visite tant que les soins ne sont pas tous cochés", () => {
    let s = creerEtatDemo(TODAY);
    const v = s.visites[0];
    s = reducer(s, { type: "visite/statut", id: v.id, statut: "realisee" });
    expect(s.visites[0].statut).toBe("a_faire");
    for (const soin of v.soins) s = reducer(s, { type: "visite/basculerSoin", id: v.id, soin });
    expect(s.visites[0].statut).toBe("en_cours");
    s = reducer(s, { type: "visite/statut", id: v.id, statut: "realisee", maintenant: "2026-10-23T09:00:00Z" });
    expect(s.visites[0].statut).toBe("realisee");
    expect(s.visites[0].confirmeeLe).toBe("2026-10-23T09:00:00Z");
  });

  it("décocher un soin annule la validation", () => {
    let s = creerEtatDemo(TODAY);
    const v = s.visites[0];
    for (const soin of v.soins) s = reducer(s, { type: "visite/basculerSoin", id: v.id, soin });
    s = reducer(s, { type: "visite/statut", id: v.id, statut: "realisee" });
    s = reducer(s, { type: "visite/basculerSoin", id: v.id, soin: v.soins[0] });
    expect(s.visites[0].statut).toBe("en_cours");
    expect(s.visites[0].confirmeeLe).toBeUndefined();
  });

  it("crée, sélectionne et supprime un cabinet avec ses données", () => {
    let s = creerEtatDemo(TODAY);
    s = reducer(s, { type: "cabinet/enregistrer", cabinet: { ...s.cabinets[0], id: "cab-test", nom: "Cabinet Test" } });
    s = reducer(s, { type: "cabinet/selectionner", id: "cab-test" });
    expect(s.cabinetSelectionneId).toBe("cab-test");
    s = reducer(s, { type: "cabinet/supprimer", id: "cab-oliviers" });
    expect(s.cabinets.find((c) => c.id === "cab-oliviers")).toBeUndefined();
    expect(s.patients.some((p) => p.cabinetId === "cab-oliviers")).toBe(false);
    expect(s.transmissions.some((t) => t.cabinetId === "cab-oliviers")).toBe(false);
  });

  it("garde toujours au moins un cabinet", () => {
    let s = creerEtatDemo(TODAY);
    s = reducer(s, { type: "cabinet/supprimer", id: "cab-port" });
    s = reducer(s, { type: "cabinet/supprimer", id: "cab-mimosas" });
    s = reducer(s, { type: "cabinet/supprimer", id: "cab-oliviers" });
    expect(s.cabinets).toHaveLength(1);
  });

  it("bascule l'indisponibilité et prépare la tournée", () => {
    let s = creerEtatDemo(TODAY);
    s = reducer(s, { type: "indisponibilite/basculer", date: "2026-12-25" });
    expect(s.indisponibilites).toContain("2026-12-25");
    s = reducer(s, { type: "indisponibilite/basculer", date: "2026-12-25" });
    expect(s.indisponibilites).not.toContain("2026-12-25");
    const avant = s.visites.length;
    s = reducer(s, { type: "tournee/preparer", cabinetId: "cab-mimosas", date: "2026-10-24" });
    expect(s.visites.length).toBe(avant + 3);
  });

  it("réinitialise les données fictives", () => {
    let s = creerEtatDemo(TODAY);
    s = reducer(s, { type: "patient/supprimer", id: s.patients[0].id });
    s = reducer(s, { type: "reinitialiser", today: TODAY });
    expect(s).toEqual(creerEtatDemo(TODAY));
  });

  it("gère les tâches et le barème km", () => {
    let s = creerEtatDemo(TODAY);
    s = reducer(s, { type: "tache/ajouter", titre: "  ", importante: true });
    const n = s.taches.length;
    s = reducer(s, { type: "tache/ajouter", titre: "Nouvelle", importante: true });
    expect(s.taches).toHaveLength(n + 1);
    s = reducer(s, { type: "tache/basculer", id: s.taches[0].id });
    expect(s.taches[0].faite).toBe(true);
    s = reducer(s, { type: "parametres/prixKm", prixKm: -2 });
    expect(s.parametres.prixKm).toBe(0.6);
  });
});
