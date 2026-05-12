"use client";

import { useState, useTransition } from "react";
import { addMenuItem } from "@/app/actions";
import { AddButton } from "@/components/add-button";
import { useWhoAmI } from "@/components/who-am-i";

const DAYS = ["Vendredi 12", "Samedi 13", "Dimanche 14", "Lundi 15"];
const MEALS = ["Déjeuner", "Dîner", "Souper", "Snacks"];
const SECTIONS = ["Boucherie", "Œufs/Laitages", "Fruits & Légumes", "Épicerie sèche", "Condiments"];
const UNITS = ["g", "ml", "unité", "tranches", "feuilles", "boîte", "sac", "barre", "biscuit", "sachet", "wrap", "bulbe"];

export function AddMenuForm({ tripId }: { tripId: number }) {
  const { isOrganizer } = useWhoAmI();
  if (!isOrganizer) return null;
  return (
    <AddButton label="Ajouter un ingrédient au menu">
      {(close) => <Form tripId={tripId} close={close} />}
    </AddButton>
  );
}

function Form({ tripId, close }: { tripId: number; close: () => void }) {
  const [day, setDay] = useState(DAYS[1]);
  const [meal, setMeal] = useState(MEALS[0]);
  const [section, setSection] = useState(SECTIONS[0]);
  const [item, setItem] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!item.trim()) return;
    startTransition(async () => {
      await addMenuItem(tripId, {
        day, meal, section,
        item: item.trim(), unit,
        qtyPerPerson: qty,
        notes: notes.trim() || undefined,
      });
      close();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Jour</span>
          <select value={day} onChange={(e) => setDay(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Repas</span>
          <select value={meal} onChange={(e) => setMeal(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
            {MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Item *</span>
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Ex: Saumon, Pommes…" required autoFocus className="px-3 py-2 border border-border rounded-lg bg-white" />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Qté/pers</span>
          <input type="number" step="0.25" value={qty} onChange={(e) => setQty(e.target.value)} required className="px-3 py-2 border border-border rounded-lg bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Unité</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Section</span>
          <select value={section} onChange={(e) => setSection(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Notes</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white" />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending || !item.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50">
          {pending ? "..." : "Ajouter"}
        </button>
        <button type="button" onClick={close} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm">Annuler</button>
      </div>
    </form>
  );
}
