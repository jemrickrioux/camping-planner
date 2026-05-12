"use client";

import { useState, useTransition } from "react";
import type { MenuItem } from "@/db/schema";
import { updateMenuItem, deleteMenuItem } from "@/app/actions";
import { useWhoAmI } from "@/components/who-am-i";

const DAYS = ["Vendredi 12", "Samedi 13", "Dimanche 14", "Lundi 15"];
const MEALS = ["Déjeuner", "Dîner", "Souper", "Snacks"];

const MEAL_COLORS: Record<string, string> = {
  Déjeuner: "bg-amber-50 border-amber-200",
  Dîner: "bg-emerald-50 border-emerald-200",
  Souper: "bg-orange-50 border-orange-200",
  Snacks: "bg-sky-50 border-sky-200",
};

export function MenuByDay({ items }: { items: MenuItem[] }) {
  return (
    <div className="space-y-4">
      {DAYS.map((day) => {
        const dayItems = items.filter((i) => i.day === day);
        if (dayItems.length === 0) {
          return (
            <details key={day} className="bg-card rounded-xl border border-border p-3">
              <summary className="font-semibold cursor-pointer">{day}</summary>
              <p className="text-sm text-muted mt-2">Aucun repas planifié.</p>
            </details>
          );
        }
        return (
          <details key={day} open className="bg-card rounded-xl border border-border overflow-hidden">
            <summary className="font-semibold px-4 py-3 cursor-pointer bg-slate-50 border-b border-border">
              {day} <span className="text-muted font-normal text-sm">— {dayItems.length} ingrédients</span>
            </summary>
            <div className="p-3 space-y-3">
              {MEALS.map((meal) => {
                const mealItems = dayItems.filter((i) => i.meal === meal);
                if (mealItems.length === 0) return null;
                return (
                  <div key={meal} className={`rounded-lg border ${MEAL_COLORS[meal]} p-3`}>
                    <h3 className="font-semibold text-sm mb-2">{meal}</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        {mealItems.map((item) => (
                          <ItemRow key={item.id} item={item} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ItemRow({ item }: { item: MenuItem }) {
  const { isOrganizer } = useWhoAmI();
  const [qty, setQty] = useState(item.qtyPerPerson);
  const [, startTransition] = useTransition();

  const handleBlur = () => {
    if (qty !== item.qtyPerPerson) {
      startTransition(() => updateMenuItem(item.id, { qtyPerPerson: qty }));
    }
  };

  const handleDelete = () => {
    if (confirm(`Supprimer "${item.item}" du menu ?`)) {
      startTransition(() => deleteMenuItem(item.id));
    }
  };

  return (
    <tr className="border-t border-slate-200/60 first:border-0">
      <td className="py-1.5 pr-2 font-medium">{item.item}</td>
      <td className="py-1.5 pr-2 text-right">
        {isOrganizer ? (
          <input
            type="number"
            step="0.25"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={handleBlur}
            className="w-16 px-1.5 py-0.5 border border-border rounded text-right bg-white"
          />
        ) : (
          <span className="px-1.5 font-semibold tabular-nums">{qty}</span>
        )}
      </td>
      <td className="py-1.5 pr-2 text-xs text-muted">{item.unit} / pers</td>
      <td className="py-1.5 text-xs text-muted">{item.notes}</td>
      <td className="py-1.5 text-right">
        {isOrganizer && (
          <button onClick={handleDelete} className="text-rose-500 hover:text-rose-700 text-xs">
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
