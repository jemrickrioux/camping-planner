"use client";

import { useState, useTransition } from "react";
import type { MenuItem } from "@/db/schema";
import { updateMenuItem, deleteMenuItem, updateMenuItemsByItem, updateMenuItemsByItemMeal } from "@/app/actions";
import { useWhoAmI } from "@/components/who-am-i";

const DAYS = ["Vendredi 12", "Samedi 13", "Dimanche 14", "Lundi 15"];
const MEALS = ["Déjeuner", "Dîner", "Souper", "Snacks"];

const MEAL_COLORS: Record<string, string> = {
  Déjeuner: "bg-amber-50 border-amber-200",
  Dîner: "bg-emerald-50 border-emerald-200",
  Souper: "bg-orange-50 border-orange-200",
  Snacks: "bg-sky-50 border-sky-200",
};

export function MenuByDay({ items, tripId }: { items: MenuItem[]; tripId: number }) {
  const { isOrganizer } = useWhoAmI();
  const [view, setView] = useState<"day" | "ingredient">("day");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-slate-100 rounded-full p-1 w-fit">
        <ViewTab active={view === "day"} onClick={() => setView("day")}>
          📅 Par jour
        </ViewTab>
        <ViewTab active={view === "ingredient"} onClick={() => setView("ingredient")}>
          🥕 Par ingrédient
        </ViewTab>
      </div>

      {!isOrganizer && (
        <div className="bg-slate-50 border border-border rounded-xl p-3 text-sm text-muted">
          🔒 Seul l'organisateur peut modifier le menu. Tu peux voir la liste.
        </div>
      )}

      {view === "day" ? (
        <ByDayView items={items} isOrganizer={isOrganizer} />
      ) : (
        <ByIngredientView items={items} tripId={tripId} isOrganizer={isOrganizer} />
      )}
    </div>
  );
}

function ByDayView({ items, isOrganizer }: { items: MenuItem[]; isOrganizer: boolean }) {
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
                          <ItemRow key={item.id} item={item} isOrganizer={isOrganizer} />
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

function ItemRow({ item, isOrganizer }: { item: MenuItem; isOrganizer: boolean }) {
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
          <button onClick={handleDelete} className="text-rose-500 hover:text-rose-700 text-xs">✕</button>
        )}
      </td>
    </tr>
  );
}

type GroupedRow = {
  item: string;
  meal: string;
  unit: string;
  qtyPerPerson: string;
  varies: boolean;
  occurrences: MenuItem[];
};

function groupByIngredient(items: MenuItem[]): GroupedRow[] {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = `${item.item}::${item.meal}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const groups: GroupedRow[] = [];
  for (const [key, occs] of map) {
    const [item, meal] = key.split("::");
    const qtys = new Set(occs.map((o) => String(o.qtyPerPerson)));
    groups.push({
      item,
      meal,
      unit: occs[0].unit,
      qtyPerPerson: occs[0].qtyPerPerson,
      varies: qtys.size > 1,
      occurrences: occs,
    });
  }
  // sort by meal then item
  const mealOrder = ["Déjeuner", "Dîner", "Souper", "Snacks"];
  groups.sort((a, b) => {
    const m = mealOrder.indexOf(a.meal) - mealOrder.indexOf(b.meal);
    if (m !== 0) return m;
    return a.item.localeCompare(b.item, "fr");
  });
  return groups;
}

function ByIngredientView({ items, tripId, isOrganizer }: { items: MenuItem[]; tripId: number; isOrganizer: boolean }) {
  const groups = groupByIngredient(items);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Chaque ligne représente un ingrédient à un type de repas. Modifier la qté/pers met à jour
        toutes les occurrences (ex: œufs au déjeuner = sam + dim + lun).
      </p>
      {MEALS.map((meal) => {
        const mealGroups = groups.filter((g) => g.meal === meal);
        if (mealGroups.length === 0) return null;
        return (
          <div key={meal} className={`rounded-2xl border ${MEAL_COLORS[meal]} p-3`}>
            <h3 className="font-semibold mb-2">{meal}</h3>
            <ul className="space-y-2">
              {mealGroups.map((g) => (
                <GroupRow key={`${g.item}::${g.meal}`} group={g} tripId={tripId} isOrganizer={isOrganizer} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function GroupRow({ group, tripId, isOrganizer }: { group: GroupedRow; tripId: number; isOrganizer: boolean }) {
  const [qty, setQty] = useState(group.qtyPerPerson);
  const [, startTransition] = useTransition();

  const handleBlur = () => {
    if (qty !== group.qtyPerPerson) {
      startTransition(() => updateMenuItemsByItemMeal(tripId, group.item, group.meal, qty));
    }
  };

  const days = group.occurrences.map((o) => o.day.split(" ")[0]).join(" + ");

  return (
    <li className="bg-white/70 rounded-xl px-3 py-2 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium">{group.item}</div>
        <div className="text-xs text-muted">
          {days} ({group.occurrences.length} repas)
          {group.varies && <span className="ml-2 text-amber-700">⚠ qtés varient — sera unifiée</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isOrganizer ? (
          <input
            type="number"
            step="0.25"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={handleBlur}
            className="w-20 px-2 py-1 border border-border rounded text-right bg-white"
          />
        ) : (
          <span className="px-2 font-semibold tabular-nums">{qty}</span>
        )}
        <span className="text-xs text-muted w-20">{group.unit} / pers</span>
      </div>
    </li>
  );
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
        active ? "bg-white shadow-sm text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// Silence unused warning
void updateMenuItemsByItem;
