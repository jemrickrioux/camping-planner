"use client";

import { useState, useTransition } from "react";
import { addTodo } from "@/app/actions";
import { AddButton } from "@/components/add-button";

export function AddTodoForm({ tripId }: { tripId: number }) {
  return (
    <AddButton label="Ajouter une tâche">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [action, setAction] = useState("");
  const [responsible, setResponsible] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!action.trim()) return;
    startTransition(async () => {
      await addTodo(tripId, {
        action: action.trim(),
        responsible: responsible.trim() || undefined,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Action *</span>
        <input
          value={action} onChange={(e) => setAction(e.target.value)}
          placeholder="Ex: Réserver les canots, Acheter la glace…"
          required autoFocus
          className="px-3 py-2 border border-border rounded-lg bg-white"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Responsable</span>
          <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Qui ?" className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Échéance</span>
          <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="Ex: J-7, 5 juin…" className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Notes</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !action.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50">
          {pending ? "..." : "Ajouter"}
        </button>
        <button type="button" onClick={close} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm">Annuler</button>
      </div>
    </form>
  );
}
