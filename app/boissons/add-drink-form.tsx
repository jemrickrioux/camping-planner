"use client";

import { useState, useTransition } from "react";
import { addDrink } from "@/app/actions";
import { AddButton } from "@/components/add-button";
import { useWhoAmI } from "@/components/who-am-i";

const CATEGORIES = ["Bières", "Spiritueux", "Vin", "Mixers", "Apéro"];

export function AddDrinkForm({ tripId }: { tripId: number }) {
  const { canManageGrocery } = useWhoAmI();
  if (!canManageGrocery) return null;
  return (
    <AddButton label="Ajouter une boisson au pool">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [item, setItem] = useState("");
  const [format, setFormat] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!item.trim()) return;
    startTransition(async () => {
      await addDrink(tripId, {
        category,
        item: item.trim(),
        format: format.trim() || undefined,
        quantity,
        notes: notes.trim() || undefined,
      });
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Catégorie</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Quantité</span>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Item *</span>
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Ex: Vodka, Sangria, Caisse de 24..." required autoFocus className="px-3 py-2 border border-border rounded-lg bg-white" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Format</span>
          <input value={format} onChange={(e) => setFormat(e.target.value)} placeholder="750 ml, 24, 2L..." className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Notes</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !item.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50">
          {pending ? "..." : "Ajouter"}
        </button>
        <button type="button" onClick={close} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm">Annuler</button>
      </div>
    </form>
  );
}
