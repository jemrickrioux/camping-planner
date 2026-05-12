"use client";

import { useState, useTransition } from "react";
import { addGroceryItem } from "@/app/actions";
import { AddButton } from "@/components/add-button";
import { useWhoAmI } from "@/components/who-am-i";

const SECTIONS = ["Boucherie", "Œufs/Laitages", "Fruits & Légumes", "Épicerie sèche", "Condiments", "Boissons", "Dépanneur"];

export function AddGroceryForm({ tripId }: { tripId: number }) {
  const { isOrganizer } = useWhoAmI();
  if (!isOrganizer) return null;
  return (
    <AddButton label="Ajouter un item d'épicerie">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [section, setSection] = useState(SECTIONS[0]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [source, setSource] = useState<"fixed" | "note">("fixed");
  const [fixedQty, setFixedQty] = useState("1");
  const [fixedText, setFixedText] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addGroceryItem(tripId, {
        section, name: name.trim(),
        unit: unit.trim() || undefined,
        source,
        fixedQtyPerPerson: source === "fixed" ? fixedQty : undefined,
        fixedText: source === "note" ? fixedText.trim() : undefined,
      });
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Section</span>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Unité</span>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: g, ml, unité..." className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Nom *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Marshmallows, Allume-feu..." required autoFocus className="px-3 py-2 border border-border rounded-lg bg-white" />
      </label>
      <div className="flex gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={source === "fixed"} onChange={() => setSource("fixed")} />
          Quantité fixe / pers
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={source === "note"} onChange={() => setSource("note")} />
          Note (pas de calcul)
        </label>
      </div>
      {source === "fixed" ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Qté / personne</span>
          <input type="number" step="0.25" value={fixedQty} onChange={(e) => setFixedQty(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Texte affiché</span>
          <input value={fixedText} onChange={(e) => setFixedText(e.target.value)} placeholder='Ex: "1 paquet", "à voir"...' className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
      )}
      <p className="text-xs text-muted">
        💡 Pour les ingrédients qui sont déjà dans le Menu, ne pas les ajouter ici — ils se calculent automatiquement.
      </p>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !name.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50">
          {pending ? "..." : "Ajouter"}
        </button>
        <button type="button" onClick={close} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm">Annuler</button>
      </div>
    </form>
  );
}
