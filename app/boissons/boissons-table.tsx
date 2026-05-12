"use client";

import { useState, useTransition } from "react";
import type { Drink, Participant } from "@/db/schema";
import { updateDrink } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";

const CAT_META: Record<string, { color: string; emoji: string }> = {
  "Bières": { color: "from-amber-50 to-yellow-100 border-amber-200", emoji: "🍺" },
  "Spiritueux": { color: "from-fuchsia-50 to-purple-100 border-fuchsia-200", emoji: "🥃" },
  "Vin": { color: "from-rose-50 to-red-100 border-rose-200", emoji: "🍷" },
  "Mixers": { color: "from-sky-50 to-cyan-100 border-sky-200", emoji: "🥤" },
  "Apéro": { color: "from-yellow-50 to-amber-100 border-yellow-200", emoji: "🍾" },
};

export function BoissonsTable({ drinks, participants }: { drinks: Drink[]; participants: Participant[] }) {
  const cats = Array.from(new Set(drinks.map((d) => d.category)));
  return (
    <div className="space-y-4">
      {cats.map((cat) => {
        const meta = CAT_META[cat] ?? { color: "from-slate-50 to-slate-100 border-slate-200", emoji: "🥂" };
        const catDrinks = drinks.filter((d) => d.category === cat);
        return (
          <div key={cat} className={`rounded-2xl border-2 bg-gradient-to-br ${meta.color} overflow-hidden`}>
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/60">
              <span className="text-2xl">{meta.emoji}</span>
              <h3 className="font-semibold">{cat}</h3>
              <span className="ml-auto text-xs text-muted">{catDrinks.length} items</span>
            </div>
            <ul className="bg-white/40">
              {catDrinks.map((d) => (
                <li key={d.id} className="border-t border-white/60 first:border-0">
                  <Row drink={d} participants={participants} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Row({ drink, participants }: { drink: Drink; participants: Participant[] }) {
  const { participantId, isOrganizer } = useWhoAmI();
  const [qty, setQty] = useState(drink.quantity ?? 0);
  const [owner, setOwner] = useState(drink.ownerId);
  const [cost, setCost] = useState(drink.cost ?? "");
  const [confirmed, setConfirmed] = useState(drink.confirmed ?? false);
  const [, startTransition] = useTransition();

  const save = (data: { quantity?: number; ownerId?: number | null; cost?: string | null; confirmed?: boolean }) => {
    startTransition(() => updateDrink(drink.id, data));
  };

  const isMine = owner === participantId;
  const ownerObj = owner ? participants.find((p) => p.id === owner) : null;

  return (
    <div className={`px-4 py-3 ${confirmed ? "bg-emerald-50/60" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => {
            if (!owner) {
              setOwner(participantId);
              save({ ownerId: participantId });
            } else if (isMine || isOrganizer) {
              const newVal = !confirmed;
              setConfirmed(newVal);
              save({ confirmed: newVal });
            }
          }}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
            confirmed
              ? "bg-emerald-500 border-emerald-600 text-white"
              : isMine
              ? "bg-teal-100 border-teal-400 hover:bg-teal-200"
              : "bg-white border-slate-300 hover:border-teal-400"
          }`}
          title={!owner ? "Je m'en occupe" : isMine ? "Marquer acheté" : ""}
        >
          {confirmed ? "✓" : isMine ? "🛒" : ""}
        </button>

        <div className="flex-1 min-w-0">
          <div className={`font-medium ${confirmed ? "line-through opacity-60" : ""}`}>{drink.item}</div>
          <div className="text-xs text-muted">
            <input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
              onBlur={() => save({ quantity: qty })}
              disabled={!isOrganizer && !isMine}
              className="w-12 px-1 py-0.5 border border-transparent hover:border-border focus:border-primary rounded text-center bg-transparent font-semibold tabular-nums"
            />
            <span> × {drink.format}</span>
            {drink.notes && <span className="ml-2">· {drink.notes}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {ownerObj ? (
            <button
              onClick={() => {
                if (isMine || isOrganizer) {
                  setOwner(null);
                  setConfirmed(false);
                  save({ ownerId: null, confirmed: false });
                }
              }}
              disabled={!isMine && !isOrganizer}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                isMine ? "bg-teal-100 text-teal-900 hover:bg-teal-200 cursor-pointer" : "bg-slate-100 text-slate-700"
              }`}
            >
              <Avatar name={ownerObj.name} size={16} />
              {ownerObj.name.split(" ")[0]}
            </button>
          ) : (
            <button
              onClick={() => {
                setOwner(participantId);
                save({ ownerId: participantId });
              }}
              className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium hover:bg-amber-200"
            >
              🙋 J'achète
            </button>
          )}
          {ownerObj && (
            <div className="flex items-center gap-0.5 text-xs">
              <span className="text-muted">$</span>
              <input
                type="number"
                step="0.01"
                value={cost ?? ""}
                onChange={(e) => setCost(e.target.value)}
                onBlur={() => save({ cost: cost === "" ? null : cost })}
                placeholder="—"
                disabled={!isMine && !isOrganizer}
                className="w-14 px-1 py-0.5 border border-border rounded-md text-right bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
