import { describe, expect, it, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { StoreProvider, STORAGE_KEY } from "@/lib/store";
import { creerEtatDemo } from "@/lib/demo-data";
import { todayISO } from "@/lib/dates";
import AppShell from "@/components/AppShell";

function monter() {
  return render(
    <StoreProvider initial={creerEtatDemo(todayISO())}>
      <AppShell />
    </StoreProvider>,
  );
}

async function aller(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

describe("application", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = "";
  });

  it("affiche l'accueil avec le cabinet sélectionné et l'avertissement données fictives", () => {
    monter();
    expect(screen.getByRole("heading", { level: 1, name: "Accueil" })).toBeInTheDocument();
    expect(screen.getAllByText(/Cabinet des Oliviers/).length).toBeGreaterThan(0);
    expect(screen.getByText(/données fictives uniquement/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
  });

  it("sauvegarde localement les modifications", async () => {
    monter();
    const champ = screen.getByLabelText("Nouvelle tâche");
    fireEvent.change(champ, { target: { value: "Tâche de test" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter la tâche" }));
    expect(screen.getByText("Tâche de test")).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain("Tâche de test");
  });

  it("dans la tournée, le bouton Valider reste désactivé tant que les soins ne sont pas cochés", async () => {
    monter();
    await aller("#/tournee");
    const cartes = screen.getAllByRole("article");
    const premiere = cartes[0];
    const valider = within(premiere).getByRole("button", { name: /Valider/ });
    expect(valider).toBeDisabled();
    for (const c of within(premiere).getAllByRole("checkbox")) fireEvent.click(c);
    expect(valider).toBeEnabled();
    fireEvent.click(valider);
    fireEvent.click(screen.getByRole("button", { name: "Je confirme" }));
    expect(within(premiere).getByText("Réalisée (confirmée)")).toBeInTheDocument();
  });

  it("navigue vers chaque module", async () => {
    monter();
    for (const [hash, titre] of [
      ["#/planning", "Planning"],
      ["#/transmissions", "Transmissions"],
      ["#/plus", "Plus"],
      ["#/cabinets", "Cabinets"],
      ["#/patients", "Patients"],
      ["#/finances", "Finances"],
      ["#/reglages", "Réglages"],
    ] as const) {
      await aller(hash);
      expect(screen.getByRole("heading", { level: 1, name: titre })).toBeInTheDocument();
    }
  });

  it("la transcription audio est une simulation signalée qui bloque la validation", async () => {
    monter();
    await aller("#/transmissions");
    fireEvent.click(screen.getByRole("radio", { name: "Nouvelle" }));
    fireEvent.change(screen.getByLabelText(/Texte de la transmission/), {
      target: { value: "[SIMULATION] exemple" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /J’ai relu/ }));
    expect(screen.getByRole("button", { name: /Valider et enregistrer/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Texte de la transmission/), { target: { value: "Clé chez la gardienne (fictif)." } });
    fireEvent.click(screen.getByRole("checkbox", { name: /J’ai relu/ }));
    expect(screen.getByRole("button", { name: /Valider et enregistrer/ })).toBeEnabled();
  });
});
