"use client";

import { useState, useTransition } from "react";
import type { Participant } from "@/db/schema";
import type { EpicerieRow } from "./page";
import { updateGroceryItem, updateDrink } from "@/app/actions";

const SECTION_META: Record<string, { color: string; emoji: string }> = {
  "Boucherie": { color: "from-rose-50 to-rose-100 border-rose-200", emoji: "🥩" },
  "Œufs/Laitages": { color: "from-amber-50 to-amber-100 border-amber-200", emoji: "🥚" },
  "Fruits & Légumes": { color: "from-emerald-50 to-emerald-100 border-emerald-200", emoji: "🥦" },
  "Épicerie sèche": { color: "from-yellow-50 to-yellow-100 border-yellow-200", emoji: "🥫" },
  "Condiments": { color: "from-pink-50 to-pink-100 border-pink-200", emoji: "🧂" },
  "Boissons": { color: "from-sky-50 to-sky-100 border-sky-200", emoji: "💧" },
  "Boissons (pool)": { color: "from-fuchsia-50 to-fuchsia-100 border-fuchsia-200", emoji: "🍻" },
  "Dépanneur": { color: "from-slate-50 to-slate-100 border-slate-200", emoji: "🛒" },
};

export function EpicerieTable({ rows }: { rows: EpicerieRow[]; participants: Participant[]; tripId: number }) {
  const [view, setView] = useState<"sections" | "grid">("grid");
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");

  const todo = rows.filter((r) => !r.confirmed && r.source !== "note");
  const done = rows.filter((r) => r.confirmed);

  const filtered = {
    all: rows,
    todo,
    done,
  }[filter];

  const sections = Array.from(new Set(filtered.map((r) => r.section)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex gap-1 bg-slate-100 rounded-full p-1">
          <ViewTab active={view === "grid"} onClick={() => setView("grid")}>
            💵 Grille prix
          </ViewTab>
          <ViewTab active={view === "sections"} onClick={() => setView("sections")}>
            📦 Par section
          </ViewTab>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Tout <span className="opacity-60">({rows.length})</span>
          </FilterChip>
          <FilterChip active={filter === "todo"} onClick={() => setFilter("todo")} color="amber">
            ⏳ Pas acheté <span className="opacity-60">({todo.length})</span>
          </FilterChip>
          <FilterChip active={filter === "done"} onClick={() => setFilter("done")} color="emerald">
            ✓ Acheté <span className="opacity-60">({done.length})</span>
          </FilterChip>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-900">
        💡 Une seule grosse liste. Ceux avec les glacières achètent tout, on calcule au bout. Coche ✓ quand un item est acheté.
      </div>

      {view === "grid" ? (
        <PriceGrid rows={filtered} />
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const meta = SECTION_META[section] ?? { color: "from-slate-50 to-slate-100 border-slate-200", emoji: "📦" };
            const sectionRows = filtered.filter((r) => r.section === section);
            if (sectionRows.length === 0) return null;
            return (
              <div key={section} className={`rounded-2xl border bg-gradient-to-br ${meta.color} overflow-hidden`}>
                <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-white/60">
                  <span className="text-2xl">{meta.emoji}</span>
                  <h3 className="font-semibold flex-1">{section}</h3>
                  <span className="text-xs text-muted">{sectionRows.length} items</span>
                </div>
                <ul className="divide-y divide-white/60 bg-white/40">
                  {sectionRows.map((row) => (
                    <li key={row.id}>
                      <SectionRow row={row} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionRow({ row }: { row: EpicerieRow }) {
  const [confirmed, setConfirmed] = useState(row.confirmed ?? false);
  const [, startTransition] = useTransition();
  const isDrink = row.source === "drink";
  const realId = isDrink ? row.id - 1000000 : row.id;

  const save = (data: { confirmed?: boolean }) => {
    startTransition(() => {
      if (isDrink) updateDrink(realId, data);
      else updateGroceryItem(realId, data);
    });
  };

  // Use pack purchase qty if available, else raw need
  const hasPack = row.packsToBuy !== null && row.packLabel;
  const purchaseQty = hasPack
    ? `${row.packRoundUp ? row.packsToBuy : (row.packsToBuy as number).toFixed(2)} ${row.packLabel}`
    : null;
  const rawNeed = row.source === "note" ? row.fixedText : `${row.toBuy} ${row.unit ?? ""}`;

  const toggleConfirmed = () => { const v = !confirmed; setConfirmed(v); save({ confirmed: v }); };

  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${confirmed ? "bg-emerald-50/60" : ""}`}>
      <button
        onClick={toggleConfirmed}
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          confirmed
            ? "bg-emerald-500 border-emerald-600 text-white"
            : "bg-white border-slate-300 hover:border-emerald-400"
        }`}
        title={confirmed ? "Marquer non acheté" : "Marquer acheté"}
      >
        {confirmed ? "✓" : ""}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-medium flex items-center gap-2 flex-wrap ${confirmed ? "line-through opacity-60" : ""}`}>
          <span>{row.name}</span>
          {purchaseQty && (
            <span className="inline-block px-2 py-0.5 bg-teal-100 text-teal-900 rounded-full text-xs font-semibold tabular-nums">
              🛒 {purchaseQty}
            </span>
          )}
        </div>
        <div className="text-xs text-muted">
          {row.source !== "note" && rawNeed && (
            <span className="tabular-nums">besoin : {rawNeed}</span>
          )}
          {row.notes && <span className="ml-2">· {row.notes}</span>}
        </div>
      </div>

      {row.effectiveCost > 0 && (
        <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
          {formatCurrency(row.effectiveCost)}
        </span>
      )}
    </div>
  );
}

function PriceGrid({ rows }: { rows: EpicerieRow[] }) {
  const sectionsInOrder = Array.from(new Set(rows.map((r) => r.section)));
  const grandTotal = rows.reduce((s, r) => s + r.effectiveCost, 0);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 text-xs text-sky-900">
        Entre la <strong>taille du pack</strong> (dans l'unité du menu : g, ml, unité, tranches…) et le <strong>prix du pack</strong>. Toggle <span className="bg-amber-100 px-1 rounded">⤴ entier</span> pour œufs/paquets, <span className="bg-sky-100 px-1 rounded">≈ continu</span> pour kg/L.
      </div>

      {/* MOBILE: card stack */}
      <div className="md:hidden">
        {sectionsInOrder.map((section) => {
          const sectionRows = rows.filter((r) => r.section === section);
          const meta = SECTION_META[section] ?? { color: "", emoji: "📦" };
          const sectionTotal = sectionRows.reduce((s, r) => s + r.effectiveCost, 0);
          return (
            <div key={section}>
              <div className="bg-slate-100/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted flex items-center justify-between">
                <span>{meta.emoji} {section}</span>
                {sectionTotal > 0 && <span className="text-right tabular-nums">{formatCurrency(sectionTotal)}</span>}
              </div>
              {sectionRows.map((row) => (
                <GridCard key={row.id} row={row} />
              ))}
            </div>
          );
        })}
        <div className="bg-emerald-50 border-t-2 border-emerald-200 font-bold px-3 py-3 flex justify-between">
          <span>TOTAL</span>
          <span className="tabular-nums text-emerald-800">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      {/* DESKTOP: table */}
      <div className="hidden md:block">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "40px" }} />
            <col />
            <col style={{ width: "80px" }} />
            <col style={{ width: "90px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "140px" }} />
            <col style={{ width: "90px" }} />
          </colgroup>
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-left border-b border-border">
              <th className="px-2 py-2 font-semibold text-center">✓</th>
              <th className="px-2 py-2 font-semibold">Item</th>
              <th className="px-2 py-2 font-semibold text-right">Besoin</th>
              <th className="px-2 py-2 font-semibold">Pack</th>
              <th className="px-2 py-2 font-semibold text-right">Taille</th>
              <th className="px-2 py-2 font-semibold text-right">Prix/pack</th>
              <th className="px-2 py-2 font-semibold text-right">À acheter</th>
              <th className="px-2 py-2 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sectionsInOrder.map((section) => {
              const sectionRows = rows.filter((r) => r.section === section);
              const meta = SECTION_META[section] ?? { color: "", emoji: "📦" };
              const sectionTotal = sectionRows.reduce((s, r) => s + r.effectiveCost, 0);
              return (
                <>
                  <tr key={`hdr-${section}`} className="bg-slate-100/50">
                    <td colSpan={7} className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      {meta.emoji} {section}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-right text-muted tabular-nums">
                      {sectionTotal > 0 && formatCurrency(sectionTotal)}
                    </td>
                  </tr>
                  {sectionRows.map((row) => (
                    <GridRow key={row.id} row={row} />
                  ))}
                </>
              );
            })}
            <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
              <td colSpan={7} className="px-2 py-2 text-right">TOTAL</td>
              <td className="px-2 py-2 text-right tabular-nums text-emerald-800">{formatCurrency(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GridCard({ row }: { row: EpicerieRow }) {
  const [packLabel, setPackLabel] = useState(row.packLabel ?? "");
  const [packSize, setPackSize] = useState(row.packSize ?? "");
  const [packPrice, setPackPrice] = useState(row.packPrice ?? "");
  const [packRoundUp, setPackRoundUp] = useState(row.packRoundUp);
  const [cost, setCost] = useState(row.cost ?? "");
  const [confirmed, setConfirmed] = useState(row.confirmed ?? false);
  const [, startTransition] = useTransition();
  const isDrink = row.source === "drink";
  const realId = isDrink ? row.id - 1000000 : row.id;
  // Simple cost mode for: drinks (alcool) and notes (condiments) — no pack pricing
  const simpleMode = isDrink || row.source === "note";

  const save = (data: Parameters<typeof updateGroceryItem>[1]) => {
    startTransition(() => {
      if (isDrink) {
        // drinks: only support cost + confirmed
        updateDrink(realId, { cost: data.cost ?? undefined, confirmed: data.confirmed });
      } else {
        updateGroceryItem(realId, data);
      }
    });
  };

  const displayBesoin = row.source === "note" ? row.fixedText : `${row.toBuy} ${row.unit ?? ""}`;

  const sizeNum = Number(packSize);
  const priceNum = Number(packPrice);
  let packsToBuy: number | null = null;
  let computedTotal: number | null = null;
  if (sizeNum > 0 && priceNum > 0) {
    const packsRaw = row.totalWithMargin / sizeNum;
    packsToBuy = packRoundUp ? Math.ceil(packsRaw) : Math.round(packsRaw * 100) / 100;
    computedTotal = packsToBuy * priceNum;
  }

  const displayedTotal = simpleMode ? Number(cost || 0) : (computedTotal ?? 0);

  return (
    <div className={`px-3 py-3 border-b border-border space-y-2 ${confirmed ? "bg-emerald-50/40" : ""}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => { const v = !confirmed; setConfirmed(v); save({ confirmed: v }); }}
          className={`w-7 h-7 rounded-md border-2 inline-flex items-center justify-center shrink-0 transition ${
            confirmed ? "bg-emerald-500 border-emerald-600 text-white" : "bg-white border-slate-300"
          }`}
        >
          {confirmed && <span className="text-sm">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${confirmed ? "line-through opacity-60" : ""}`}>{row.name}</div>
          <div className="text-xs text-muted">
            Besoin : <span className="font-semibold tabular-nums">{displayBesoin}</span>
            {row.notes && <span className="ml-2">· {row.notes}</span>}
          </div>
        </div>
        {displayedTotal > 0 && (
          <div className="text-right">
            <div className="text-base font-bold tabular-nums">{formatCurrency(displayedTotal)}</div>
            {!simpleMode && packsToBuy !== null && (
              <div className="text-xs text-muted">
                {packRoundUp ? packsToBuy : packsToBuy.toFixed(2)} {packLabel}
              </div>
            )}
          </div>
        )}
      </div>

      {simpleMode ? (
        <label className="flex items-center gap-2">
          <span className="text-xs text-muted shrink-0">Total $</span>
          <input
            type="number" step="0.01" value={cost ?? ""}
            onChange={(e) => setCost(e.target.value)}
            onBlur={() => save({ cost: cost === "" ? null : cost })}
            placeholder="—"
            className="flex-1 px-2 py-1.5 text-sm border border-border rounded-md text-right bg-white tabular-nums"
          />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted">Pack</span>
              <input
                type="text" value={packLabel}
                onChange={(e) => setPackLabel(e.target.value)}
                onBlur={() => save({ packLabel: packLabel || null })}
                placeholder="kg, dz…"
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-white"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted">Taille ({row.unit ?? "—"})</span>
              <input
                type="number" step="0.01" value={packSize ?? ""}
                onChange={(e) => setPackSize(e.target.value)}
                onBlur={() => save({ packSize: packSize === "" ? null : packSize })}
                placeholder={packHint(row.unit)}
                className="px-2 py-1.5 text-sm border border-border rounded-md text-right bg-white tabular-nums w-24"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted">Prix / pack</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted">$</span>
                <input
                  type="number" step="0.01" value={packPrice ?? ""}
                  onChange={(e) => setPackPrice(e.target.value)}
                  onBlur={() => save({ packPrice: packPrice === "" ? null : packPrice })}
                  placeholder="—"
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-border rounded-md text-right bg-white tabular-nums"
                />
              </div>
            </label>
          </div>
          {sizeNum > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => { const v = !packRoundUp; setPackRoundUp(v); save({ packRoundUp: v }); }}
                className={`text-xs px-2 py-1 rounded ${packRoundUp ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}
              >
                {packRoundUp ? "⤴ Arrondir aux paquets entiers" : "≈ Continu (kg, L)"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GridRow({ row }: { row: EpicerieRow }) {
  const [packLabel, setPackLabel] = useState(row.packLabel ?? "");
  const [packSize, setPackSize] = useState(row.packSize ?? "");
  const [packPrice, setPackPrice] = useState(row.packPrice ?? "");
  const [packRoundUp, setPackRoundUp] = useState(row.packRoundUp);
  const [cost, setCost] = useState(row.cost ?? "");
  const [confirmed, setConfirmed] = useState(row.confirmed ?? false);
  const [, startTransition] = useTransition();
  const isDrink = row.source === "drink";
  const realId = isDrink ? row.id - 1000000 : row.id;
  const simpleMode = isDrink || row.source === "note";

  const save = (data: Parameters<typeof updateGroceryItem>[1]) => {
    startTransition(() => {
      if (isDrink) updateDrink(realId, { cost: data.cost ?? undefined, confirmed: data.confirmed });
      else updateGroceryItem(realId, data);
    });
  };

  const displayBesoin = row.source === "note"
    ? row.fixedText
    : `${row.toBuy} ${row.unit ?? ""}`;

  const sizeNum = Number(packSize);
  const priceNum = Number(packPrice);
  let packsToBuy: number | null = null;
  let computedTotal: number | null = null;
  if (sizeNum > 0 && priceNum > 0) {
    const packsRaw = row.totalWithMargin / sizeNum;
    packsToBuy = packRoundUp ? Math.ceil(packsRaw) : Math.round(packsRaw * 100) / 100;
    computedTotal = packsToBuy * priceNum;
  }

  const displayedTotal = simpleMode ? Number(cost || 0) : (computedTotal ?? 0);

  return (
    <tr className={`border-b border-border ${confirmed ? "bg-emerald-50/40" : ""}`}>
      <td className="px-2 py-1.5 text-center">
        <button
          onClick={() => { const v = !confirmed; setConfirmed(v); save({ confirmed: v }); }}
          className={`w-6 h-6 rounded-md border-2 inline-flex items-center justify-center transition ${
            confirmed ? "bg-emerald-500 border-emerald-600 text-white" : "bg-white border-slate-300 hover:border-emerald-400"
          }`}
        >
          {confirmed && <span className="text-xs">✓</span>}
        </button>
      </td>
      <td className="px-2 py-1.5">
        <div className={`font-medium text-sm ${confirmed ? "line-through opacity-60" : ""}`}>{row.name}</div>
        {row.notes && <div className="text-xs text-muted">{row.notes}</div>}
      </td>
      <td className="px-2 py-1.5 text-right text-xs tabular-nums whitespace-nowrap text-muted">{displayBesoin}</td>

      {simpleMode ? (
        // Simple cost mode: take 4 columns (Pack/Taille/Prix/À acheter) with one big "Total $" input
        <td colSpan={4} className="px-2 py-1.5">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-muted">Total $</span>
            <input
              type="number" step="0.01"
              value={cost ?? ""}
              onChange={(e) => setCost(e.target.value)}
              onBlur={() => save({ cost: cost === "" ? null : cost })}
              placeholder="—"
              className="w-32 px-2 py-1.5 text-sm border border-border rounded-md text-right bg-white tabular-nums"
            />
          </div>
        </td>
      ) : (
        <>
          <td className="px-2 py-1.5">
            <input
              type="text"
              value={packLabel}
              onChange={(e) => setPackLabel(e.target.value)}
              onBlur={() => save({ packLabel: packLabel || null })}
              placeholder="kg, dz…"
              className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-white"
            />
          </td>

          <td className="px-2 py-1.5">
            <div className="flex items-center gap-1 justify-end">
              <input
                type="number" step="0.01"
                value={packSize ?? ""}
                onChange={(e) => setPackSize(e.target.value)}
                onBlur={() => save({ packSize: packSize === "" ? null : packSize })}
                placeholder={packHint(row.unit)}
                className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-border rounded-md text-right bg-white tabular-nums"
              />
              {row.unit && <span className="text-xs text-muted whitespace-nowrap">{row.unit}</span>}
            </div>
          </td>

          <td className="px-2 py-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted">$</span>
              <input
                type="number" step="0.01"
                value={packPrice ?? ""}
                onChange={(e) => setPackPrice(e.target.value)}
                onBlur={() => save({ packPrice: packPrice === "" ? null : packPrice })}
                placeholder="—"
                className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-border rounded-md text-right bg-white tabular-nums"
              />
            </div>
          </td>

          <td className="px-2 py-1.5 text-right text-xs tabular-nums whitespace-nowrap">
            {packsToBuy !== null && (
              <span className="flex items-center justify-end gap-1">
                <span className="font-semibold">{packRoundUp ? packsToBuy : packsToBuy.toFixed(2)}</span>
                <span className="text-muted">{packLabel}</span>
                <button
                  onClick={() => { const v = !packRoundUp; setPackRoundUp(v); save({ packRoundUp: v }); }}
                  className={`ml-0.5 text-[10px] px-1 py-0.5 rounded ${packRoundUp ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}
                  title={packRoundUp ? "Mode 'entier' (œufs, paquets)" : "Mode 'continu' (kg, L)"}
                >
                  {packRoundUp ? "⤴" : "≈"}
                </button>
              </span>
            )}
          </td>
        </>
      )}

      <td className="px-2 py-1.5 text-right text-sm tabular-nums font-semibold whitespace-nowrap">
        {displayedTotal > 0 ? formatCurrency(displayedTotal) : "—"}
      </td>
    </tr>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

function packHint(unit: string | null | undefined): string {
  if (!unit) return "—";
  const map: Record<string, string> = {
    g: "ex: 1000 = 1kg",
    ml: "ex: 1000 = 1L",
    "unité": "ex: 12 = dz",
    tranches: "ex: 24 = paquet",
    biscuit: "ex: 12 = boîte",
    sachet: "ex: 8 = boîte",
    barre: "ex: 5 = boîte",
    sac: "ex: 1",
    boîte: "ex: 1",
    rouleau: "ex: 6",
  };
  return map[unit] ?? `ex: # ${unit}/pack`;
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
        active ? "bg-white shadow-sm text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active, onClick, children, color = "slate",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "slate" | "amber" | "emerald";
}) {
  const colors = {
    slate: active ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700",
    amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700",
    emerald: active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700",
  }[color];
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${colors}`}
    >
      {children}
    </button>
  );
}
