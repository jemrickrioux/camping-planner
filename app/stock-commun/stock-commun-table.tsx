"use client";

import { useState, useTransition } from "react";
import type { CommunStockItem, Participant } from "@/db/schema";
import { updateCommunStock } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";

export function StockCommunTable({
  items,
  participants,
}: {
  items: CommunStockItem[];
  participants: Participant[];
}) {
  const { participantId, isOrganizer } = useWhoAmI();
  const [filter, setFilter] = useState<"all" | "mine" | "available" | "needs-confirm">("all");

  const myItems = items.filter((i) => i.ownerId === participantId);
  const available = items.filter((i) => i.ownerId === null && !i.isGroup);
  const needsConfirm = items.filter((i) => (i.ownerId !== null || i.isGroup) && !i.confirmed);

  const filteredItems = {
    all: items,
    mine: myItems,
    available,
    "needs-confirm": needsConfirm,
  }[filter];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-thin">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Tous <span className="opacity-60">({items.length})</span>
        </FilterChip>
        <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")} color="teal">
          🎒 À moi <span className="opacity-60">({myItems.length})</span>
        </FilterChip>
        <FilterChip active={filter === "available"} onClick={() => setFilter("available")} color="amber">
          🆓 Sans owner <span className="opacity-60">({available.length})</span>
        </FilterChip>
        <FilterChip active={filter === "needs-confirm"} onClick={() => setFilter("needs-confirm")} color="sky">
          ⏳ À confirmer <span className="opacity-60">({needsConfirm.length})</span>
        </FilterChip>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            participants={participants}
            currentUserId={participantId!}
            isOrganizer={isOrganizer}
          />
        ))}
        {filteredItems.length === 0 && (
          <li className="col-span-full text-center text-muted py-12">Rien ici 🎉</li>
        )}
      </ul>
    </div>
  );
}

function ItemCard({
  item, participants, currentUserId, isOrganizer,
}: {
  item: CommunStockItem;
  participants: Participant[];
  currentUserId: number;
  isOrganizer: boolean;
}) {
  const [ownerId, setOwnerId] = useState(item.ownerId);
  const [isGroup, setIsGroup] = useState(item.isGroup ?? false);
  const [confirmed, setConfirmed] = useState(item.confirmed ?? false);
  const [, startTransition] = useTransition();

  const owner = ownerId ? participants.find((p) => p.id === ownerId) : null;
  const isMine = ownerId === currentUserId;
  const hasOwner = ownerId !== null || isGroup;
  const canConfirm = isMine || isGroup || isOrganizer;
  const canRelease = isMine || isOrganizer;
  const canChangeOwner = isOrganizer;

  const save = (data: { ownerId?: number | null; isGroup?: boolean; confirmed?: boolean }) => {
    startTransition(() => updateCommunStock(item.id, data));
  };

  const handleClaim = () => {
    setOwnerId(currentUserId);
    setIsGroup(false);
    save({ ownerId: currentUserId, isGroup: false });
  };

  const handleRelease = () => {
    setOwnerId(null);
    setIsGroup(false);
    setConfirmed(false);
    save({ ownerId: null, isGroup: false, confirmed: false });
  };

  const handleGroup = () => {
    setOwnerId(null);
    setIsGroup(true);
    save({ ownerId: null, isGroup: true });
  };

  const handleConfirm = () => {
    const newVal = !confirmed;
    setConfirmed(newVal);
    save({ confirmed: newVal });
  };

  const borderColor = confirmed
    ? "border-emerald-300"
    : !hasOwner
    ? "border-amber-300"
    : isMine
    ? "border-teal-300"
    : "border-border";

  const bg = confirmed
    ? "bg-emerald-50"
    : !hasOwner
    ? "bg-amber-50/50"
    : "bg-card";

  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bg} p-4 flex flex-col gap-3 transition`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{item.name}</div>
          {item.quantity && item.quantity > 1 && (
            <div className="text-xs text-muted">Quantité : {item.quantity}</div>
          )}
          {item.notes && <div className="text-xs text-muted mt-1">{item.notes}</div>}
        </div>
        {confirmed && <span className="text-emerald-600 text-lg">✓</span>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Owner badge */}
        {isGroup ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-medium">
            👥 Groupe
          </span>
        ) : owner ? (
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isMine ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-700"
          }`}>
            <Avatar name={owner.name} size={18} />
            {owner.name.split(" ")[0]}
            {isMine && <span className="opacity-60">(toi)</span>}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            🆓 Sans owner
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mt-auto">
        {!hasOwner && (
          <>
            <button
              onClick={handleClaim}
              className="px-3 py-1.5 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition"
            >
              🙋 Je m'en occupe
            </button>
            {isOrganizer && (
              <button
                onClick={handleGroup}
                className="px-3 py-1.5 bg-sky-100 text-sky-800 rounded-full text-sm font-medium hover:bg-sky-200 transition"
              >
                👥 C'est groupe
              </button>
            )}
          </>
        )}
        {hasOwner && canConfirm && (
          <button
            onClick={handleConfirm}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              confirmed
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {confirmed ? "✓ Confirmé" : "Je l'ai !"}
          </button>
        )}
        {hasOwner && canRelease && (
          <button
            onClick={handleRelease}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-200 transition"
          >
            Relâcher
          </button>
        )}
        {canChangeOwner && hasOwner && (
          <select
            value={isGroup ? "GROUPE" : ownerId ? String(ownerId) : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "GROUPE") handleGroup();
              else if (v === "") handleRelease();
              else {
                const newId = parseInt(v, 10);
                setOwnerId(newId);
                setIsGroup(false);
                save({ ownerId: newId, isGroup: false });
              }
            }}
            className="text-xs px-2 py-1 border border-border rounded-full bg-white"
          >
            <option value="">—</option>
            <option value="GROUPE">👥 Groupe</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>👤 {p.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
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
