"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import type { CouleurCabinet } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const couleurs: Record<CouleurCabinet, { pastille: string; fond: string; texte: string; nom: string }> = {
  bleu: { pastille: "bg-sky-500", fond: "bg-sky-50", texte: "text-sky-800", nom: "Bleu" },
  vert: { pastille: "bg-emerald-500", fond: "bg-emerald-50", texte: "text-emerald-800", nom: "Vert" },
  ambre: { pastille: "bg-amber-500", fond: "bg-amber-50", texte: "text-amber-800", nom: "Ambre" },
  violet: { pastille: "bg-violet-500", fond: "bg-violet-50", texte: "text-violet-800", nom: "Violet" },
  rose: { pastille: "bg-rose-500", fond: "bg-rose-50", texte: "text-rose-800", nom: "Rose" },
};

export function Card({ children, className, as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "li" | "article" }) {
  return <As className={cx("rounded-3xl bg-white p-4 shadow-[0_2px_12px_rgba(30,42,59,0.06)] ring-1 ring-slate-100", className)}>{children}</As>;
}

type Variante = "primaire" | "secondaire" | "vert" | "danger" | "fantome";

const styles: Record<Variante, string> = {
  primaire: "bg-bleu-600 text-white active:bg-bleu-700 disabled:bg-slate-300",
  vert: "bg-vert-600 text-white active:bg-vert-700 disabled:bg-slate-300 disabled:text-slate-600",
  secondaire: "bg-bleu-50 text-bleu-700 ring-1 ring-bleu-100 active:bg-bleu-100 disabled:opacity-50",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-100 active:bg-rose-100",
  fantome: "bg-transparent text-bleu-700 active:bg-bleu-50",
};

export function Button({
  variante = "primaire",
  className,
  pleineLargeur,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; pleineLargeur?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition-colors disabled:cursor-not-allowed",
        styles[variante],
        pleineLargeur && "w-full",
        className,
      )}
    />
  );
}

export function IconButton({ label, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-doux active:bg-slate-100 disabled:opacity-30",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "bleu" | "vert" | "ambre" | "rouge" | "violet" }) {
  const t = {
    neutre: "bg-slate-100 text-slate-700",
    bleu: "bg-bleu-100 text-bleu-700",
    vert: "bg-vert-100 text-vert-700",
    ambre: "bg-amber-100 text-amber-800",
    rouge: "bg-rose-100 text-rose-700",
    violet: "bg-violet-100 text-violet-800",
  }[ton];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", t)}>{children}</span>;
}

export function TitreSection({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1">
      <h2 className="text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function Vide({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-slate-50 p-4 text-center text-doux">{children}</p>;
}

export function Pastille({ couleur, className }: { couleur: CouleurCabinet; className?: string }) {
  return <span aria-hidden className={cx("inline-block h-3 w-3 shrink-0 rounded-full", couleurs[couleur].pastille, className)} />;
}

/** Feuille modale (bas d'écran) basée sur <dialog> natif : accessible et compatible iPhone. */
export function Feuille({
  ouverte,
  onFermer,
  titre,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titreId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
    }
    if (!ouverte && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
  }, [ouverte]);

  return (
    <dialog
      ref={ref}
      className="feuille"
      aria-labelledby={titreId}
      onCancel={(e) => {
        e.preventDefault();
        onFermer();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onFermer();
      }}
    >
      {ouverte && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <h2 id={titreId} className="text-lg font-bold">
              {titre}
            </h2>
            <IconButton label="Fermer" onClick={onFermer}>
              <X size={22} />
            </IconButton>
          </div>
          <div className="overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

/** Demande de confirmation explicite. */
export function Confirmation({
  ouverte,
  titre,
  message,
  libelleConfirmer,
  variante = "primaire",
  onConfirmer,
  onAnnuler,
}: {
  ouverte: boolean;
  titre: string;
  message: ReactNode;
  libelleConfirmer: string;
  variante?: Variante;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  return (
    <Feuille ouverte={ouverte} onFermer={onAnnuler} titre={titre}>
      <div className="space-y-4">
        <div className="text-base text-doux">{message}</div>
        <div className="grid grid-cols-2 gap-3">
          <Button variante="secondaire" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button variante={variante} onClick={onConfirmer}>
            {libelleConfirmer}
          </Button>
        </div>
      </div>
    </Feuille>
  );
}

export function Champ({ label, children, aide }: { label: string; children: ReactNode; aide?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-encre">{label}</span>
      {children}
      {aide && <span className="mt-1 block text-xs text-doux">{aide}</span>}
    </label>
  );
}

export const inputClass =
  "block w-full min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-encre placeholder:text-slate-400 focus:border-bleu-500 focus:outline-none focus:ring-2 focus:ring-bleu-200";

export function Avertissement({ children, ton = "ambre" }: { children: ReactNode; ton?: "ambre" | "bleu" | "rouge" }) {
  const t = {
    ambre: "bg-amber-50 text-amber-900 ring-amber-200",
    bleu: "bg-bleu-50 text-bleu-700 ring-bleu-100",
    rouge: "bg-rose-50 text-rose-800 ring-rose-200",
  }[ton];
  return <div className={cx("rounded-2xl p-3 text-sm ring-1", t)}>{children}</div>;
}

export function Segments<T extends string>({
  options,
  valeur,
  onChange,
  label,
}: {
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          role="radio"
          aria-checked={valeur === o.valeur}
          onClick={() => onChange(o.valeur)}
          className={cx(
            "min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold",
            valeur === o.valeur ? "bg-white text-bleu-700 shadow-sm" : "text-doux",
          )}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}
