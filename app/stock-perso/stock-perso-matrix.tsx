"use client";

import { useTransition, useState, useMemo } from "react";
import type { Participant, PersoStockItem } from "@/db/schema";
import { togglePersoStockCheck } from "@/app/actions";
import { useWhoAmI } from "@/components/who-am-i";
import { Avatar } from "@/components/who-am-i";

type Check = {
  participantId: number;
  persoStockItemId: number;
  hasIt: boolean;
};

export function StockPersoMatrix({
  items,
  participants,
  checks,
}: {
  items: PersoStockItem[];
  participants: Participant[];
  checks: Check[];
}) {
  const { participantId, participant } = useWhoAmI();
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const checkKey = (pid: number, iid: number) => `${pid}-${iid}`;

  const initialMap = useMemo(() => {
    const m = new Map<string, boolean>();
    checks.forEach((c) => m.set(checkKey(c.participantId, c.persoStockItemId), c.hasIt));
    return m;
  }, [checks]);

  const isChecked = (pid: number, iid: number) => {
    const k = checkKey(pid, iid);
    if (k in optimistic) return optimistic[k];
    return initialMap.get(k) ?? false;
  };

  const myChecked = items.filter((i) => isChecked(participantId!, i.id)).length;
  const myProgress = items.length === 0 ? 0 : Math.round((myChecked / items.length) * 100);

  const totalChecked = (iid: number) =>
    participants.filter((p) => isChecked(p.id, iid)).length;

  return (
    <div className="space-y-4">
      {/* Hero progress card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <ProgressRing pct={myProgress} size={84} stroke={8} />
          <div className="flex-1">
            <div className="text-sm text-muted">Ta liste</div>
            <div className="text-2xl font-bold">
              {myChecked} / {items.length} items prêts
            </div>
            <div className="text-sm text-muted mt-1">
              {myProgress < 100 ? `Encore ${items.length - myChecked} à cocher` : "Tu es prêt 🎉"}
            </div>
          </div>
        </div>
      </div>

      {/* MY checklist */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">🎒 Ma liste</h2>
        <ul className="space-y-2">
          {items.map((item) => {
            const checked = isChecked(participantId!, item.id);
            const total = totalChecked(item.id);
            const allChecked = total === participants.length;
            return (
              <li key={item.id}>
                <ItemRow
                  item={item}
                  checked={checked}
                  total={total}
                  totalCount={participants.length}
                  onToggle={(newVal) => {
                    const k = checkKey(participantId!, item.id);
                    setOptimistic((o) => ({ ...o, [k]: newVal }));
                  }}
                  participantId={participantId!}
                  allChecked={allChecked}
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Group status */}
      <details className="bg-card rounded-2xl border border-border overflow-hidden">
        <summary className="px-4 py-3 font-semibold cursor-pointer flex items-center justify-between">
          <span>👥 Statut du groupe</span>
          <span className="text-sm text-muted font-normal">Voir qui a coché quoi</span>
        </summary>
        <div className="p-4 pt-2 space-y-2">
          {participants.map((p) => {
            const pChecked = items.filter((i) => isChecked(p.id, i.id)).length;
            const pPct = items.length === 0 ? 0 : Math.round((pChecked / items.length) * 100);
            const isMe = p.id === participantId;
            return (
              <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl ${isMe ? "bg-teal-50" : ""}`}>
                <Avatar name={p.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {p.name} {isMe && <span className="text-xs text-teal-700">(toi)</span>}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${pPct === 100 ? "bg-emerald-500" : "bg-amber-500"} transition-all`}
                      style={{ width: `${pPct}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-muted">{pChecked}/{items.length}</div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function ItemRow({
  item, checked, total, totalCount, onToggle, participantId, allChecked,
}: {
  item: PersoStockItem;
  checked: boolean;
  total: number;
  totalCount: number;
  onToggle: (val: boolean) => void;
  participantId: number;
  allChecked: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const newVal = !checked;
    onToggle(newVal);
    startTransition(() => {
      togglePersoStockCheck(participantId, item.id, newVal);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition group ${
        checked
          ? "bg-teal-50 border-teal-200"
          : "bg-card border-border hover:border-teal-300"
      } ${pending ? "opacity-60" : ""}`}
    >
      <div
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
          checked ? "bg-teal-500 border-teal-600 text-white" : "bg-white border-slate-300"
        }`}
      >
        {checked && <span className="text-sm">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${checked ? "" : ""}`}>{item.name}</div>
        {item.notes && <div className="text-xs text-muted mt-0.5">{item.notes}</div>}
      </div>
      <div className={`text-xs px-2 py-1 rounded-full shrink-0 ${
        allChecked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}>
        {total}/{totalCount}
      </div>
    </button>
  );
}

function ProgressRing({ pct, size = 64, stroke = 6 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} className="stroke-amber-100" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} className="stroke-amber-500" strokeWidth={stroke} fill="none"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: "stroke-dashoffset 0.5s" }}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        className="fill-amber-700 font-bold rotate-90"
        style={{ transformOrigin: "center", fontSize: size * 0.28 }}
      >
        {pct}%
      </text>
    </svg>
  );
}
