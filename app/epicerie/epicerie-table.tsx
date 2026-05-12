"use client";

import { useState, useTransition } from "react";
import type { Participant } from "@/db/schema";
import type { EpicerieRow } from "./page";
import { updateGroceryItem, updateDrink, bulkAssignGrocerySection } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";

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

export function EpicerieTable({ rows, participants, tripId }: { rows: EpicerieRow[]; participants: Participant[]; tripId: number }) {
  const { participantId } = useWhoAmI();
  const [filter, setFilter] = useState<"all" | "mine" | "no-buyer" | "todo">("all");

  const mine = rows.filter((r) => r.buyerId === participantId);
  const noBuyer = rows.filter((r) => r.buyerId === null && r.source !== "note");
  const todo = rows.filter((r) => !r.confirmed && r.source !== "note");

  const filtered = {
    all: rows,
    mine,
    "no-buyer": noBuyer,
    todo,
  }[filter];

  const sections = Array.from(new Set(filtered.map((r) => r.section)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-thin">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Tout <span className="opacity-60">({rows.length})</span>
        </FilterChip>
        <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")} color="teal">
          🎒 J'achète <span className="opacity-60">({mine.length})</span>
        </FilterChip>
        <FilterChip active={filter === "no-buyer"} onClick={() => setFilter("no-buyer")} color="amber">
          🆓 Sans acheteur <span className="opacity-60">({noBuyer.length})</span>
        </FilterChip>
        <FilterChip active={filter === "todo"} onClick={() => setFilter("todo")} color="sky">
          ⏳ Pas acheté <span className="opacity-60">({todo.length})</span>
        </FilterChip>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-900">
        💡 <strong>Idée :</strong> faites max 2 personnes qui achètent (celles avec glacières). Utilise le bouton "Assigner toute la section" pour grouper rapidement.
      </div>

      <div className="space-y-3">
        {sections.map((section) => {
          const meta = SECTION_META[section] ?? { color: "from-slate-50 to-slate-100 border-slate-200", emoji: "📦" };
          const sectionRows = filtered.filter((r) => r.section === section);
          if (sectionRows.length === 0) return null;
          // Don't allow bulk-assign on virtual "Boissons (pool)" rows (those are drinks)
          const showBulk = section !== "Boissons (pool)";
          return (
            <div key={section} className={`rounded-2xl border bg-gradient-to-br ${meta.color} overflow-hidden`}>
              <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-white/60">
                <span className="text-2xl">{meta.emoji}</span>
                <h3 className="font-semibold flex-1">{section}</h3>
                <span className="text-xs text-muted">{sectionRows.length} items</span>
                {showBulk && (
                  <SectionBulkAssign
                    section={section}
                    tripId={tripId}
                    participants={participants}
                  />
                )}
              </div>
              <ul className="divide-y divide-white/60 bg-white/40">
                {sectionRows.map((row) => (
                  <li key={row.id}>
                    <Row row={row} participants={participants} currentUserId={participantId!} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({
  row, participants, currentUserId,
}: {
  row: EpicerieRow;
  participants: Participant[];
  currentUserId: number;
}) {
  const [buyerId, setBuyerId] = useState(row.buyerId);
  const [cost, setCost] = useState(row.cost ?? "");
  const [confirmed, setConfirmed] = useState(row.confirmed ?? false);
  const [, startTransition] = useTransition();
  const isDrink = row.source === "drink";
  const realId = isDrink ? row.id - 1000000 : row.id;

  const save = (data: { buyerId?: number | null; cost?: string | null; confirmed?: boolean }) => {
    startTransition(() => {
      if (isDrink) updateDrink(realId, data);
      else updateGroceryItem(realId, data);
    });
  };

  const buyer = buyerId ? participants.find((p) => p.id === buyerId) : null;
  const isMine = buyerId === currentUserId;

  const handleClaim = () => {
    setBuyerId(currentUserId);
    save({ buyerId: currentUserId });
  };

  const handleRelease = () => {
    setBuyerId(null);
    setConfirmed(false);
    save({ buyerId: null, confirmed: false });
  };

  const handleConfirm = () => {
    const newVal = !confirmed;
    setConfirmed(newVal);
    save({ confirmed: newVal });
  };

  const displayQty = row.source === "note" ? row.fixedText : `${row.toBuy} ${row.unit ?? ""}`;

  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${confirmed ? "bg-emerald-50/60" : ""}`}>
      <button
        onClick={confirmed ? handleConfirm : (isMine ? handleConfirm : handleClaim)}
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          confirmed
            ? "bg-emerald-500 border-emerald-600 text-white"
            : isMine
            ? "bg-teal-100 border-teal-400 hover:bg-teal-200"
            : "bg-white border-slate-300 hover:border-teal-400"
        }`}
        title={confirmed ? "Marquer non acheté" : isMine ? "Marquer acheté" : "Je m'en occupe"}
      >
        {confirmed ? "✓" : isMine ? "🛒" : ""}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-medium ${confirmed ? "line-through opacity-60" : ""}`}>{row.name}</div>
        <div className="text-xs text-muted">
          {row.source !== "note" && <span className="font-semibold tabular-nums">{displayQty}</span>}
          {row.notes && <span className="ml-2">· {row.notes}</span>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        {/* Buyer */}
        {buyer ? (
          <button
            onClick={isMine ? handleRelease : undefined}
            disabled={!isMine}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isMine ? "bg-teal-100 text-teal-900 hover:bg-teal-200 cursor-pointer" : "bg-slate-100 text-slate-700"
            }`}
            title={isMine ? "Relâcher" : ""}
          >
            <Avatar name={buyer.name} size={16} />
            {buyer.name.split(" ")[0]}
          </button>
        ) : (
          row.source !== "note" && (
            <button
              onClick={handleClaim}
              className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium hover:bg-amber-200"
            >
              🙋 Je l'achète
            </button>
          )
        )}
        {/* Cost (only if has buyer) */}
        {buyer && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted">$</span>
            <input
              type="number"
              step="0.01"
              value={cost ?? ""}
              onChange={(e) => setCost(e.target.value)}
              onBlur={() => save({ cost: cost === "" ? null : cost })}
              placeholder="—"
              className="w-16 px-1.5 py-0.5 border border-border rounded-md text-right bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionBulkAssign({
  section, tripId, participants,
}: {
  section: string;
  tripId: number;
  participants: Participant[];
}) {
  const [, startTransition] = useTransition();
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") return;
        const buyerId = v === "NONE" ? null : parseInt(v, 10);
        if (!confirm(v === "NONE"
          ? `Vider l'acheteur pour toute la section "${section}" ?`
          : `Assigner toute la section "${section}" à ${participants.find((p) => p.id === buyerId)?.name} ?`
        )) {
          e.target.value = "";
          return;
        }
        startTransition(() => bulkAssignGrocerySection(tripId, section, buyerId));
        e.target.value = "";
      }}
      className="text-xs px-2 py-1 border border-border rounded-full bg-white"
      title="Assigner toute la section à un acheteur"
    >
      <option value="">⚡ Assigner section…</option>
      <option value="NONE">— Aucun —</option>
      {participants.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

function FilterChip({
  active, onClick, children, color = "slate",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: "slate" | "teal" | "amber" | "sky";
}) {
  const colors = {
    slate: active ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700",
    teal: active ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700",
    amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700",
    sky: active ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700",
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
