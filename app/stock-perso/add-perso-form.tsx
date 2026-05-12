"use client";

import { useState, useTransition } from "react";
import { addPersoStockItem } from "@/app/actions";
import { AddButton } from "@/components/add-button";
import { useWhoAmI } from "@/components/who-am-i";

export function AddPersoForm({ tripId }: { tripId: number }) {
  const { isOrganizer } = useWhoAmI();
  if (!isOrganizer) return null;
  return (
    <AddButton label="Ajouter un item à la liste perso">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addPersoStockItem(tripId, name.trim(), notes.trim() || undefined);
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Nom *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Trousse de toilette, Hamac..." required autoFocus className="px-3 py-2 border border-border rounded-lg bg-white" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Notes</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white" />
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
