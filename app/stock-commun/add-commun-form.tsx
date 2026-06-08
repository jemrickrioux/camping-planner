"use client";

import { useState, useTransition } from "react";
import { addCommunStockItem } from "@/app/actions";
import { AddButton } from "@/components/add-button";

export function AddCommunForm({ tripId }: { tripId: number }) {
  return (
    <AddButton label="Ajouter un item au stock commun">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addCommunStockItem(tripId, { name: name.trim(), quantity, notes: notes.trim() || undefined });
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <div className="grid grid-cols-[1fr_80px] gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Nom de l'item *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Glacière, Hache, Carte du parc…"
            required
            className="px-3 py-2 border border-border rounded-lg bg-white"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Qté</span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="px-3 py-2 border border-border rounded-lg bg-white"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Notes (optionnel)</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Précisions, taille, etc."
          className="px-3 py-2 border border-border rounded-lg bg-white"
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !name.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50">
          {pending ? "..." : "Ajouter"}
        </button>
        <button type="button" onClick={close} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm">Annuler</button>
      </div>
    </form>
  );
}
