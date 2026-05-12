"use client";

import { useState, useTransition } from "react";
import { addParticipant } from "@/app/actions";
import { AddButton } from "@/components/add-button";
import { useWhoAmI } from "@/components/who-am-i";

export function AddParticipantForm({ tripId }: { tripId: number }) {
  const { isOrganizer } = useWhoAmI();
  if (!isOrganizer) return null;
  return (
    <AddButton label="Ajouter un participant">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await addParticipant(tripId, name.trim());
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Nom complet *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" required autoFocus className="px-3 py-2 border border-border rounded-lg bg-white" />
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
