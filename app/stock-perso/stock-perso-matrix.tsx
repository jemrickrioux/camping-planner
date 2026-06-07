"use client";

import { useTransition, useState, useMemo } from "react";
import type { Participant, PersoStockItem, PersoStatus } from "@/db/schema";
import { PERSO_STATUSES } from "@/db/schema";
import { setPersoStockStatus } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";

type Check = {
  participantId: number;
  persoStockItemId: number;
  hasIt: boolean;
  status: string;
};

const isStatus = (s: string): s is PersoStatus =>
  (PERSO_STATUSES as readonly string[]).includes(s);

const STATUS_META: Record<PersoStatus, { label: string; emoji: string; color: string; ring: string }> = {
  to_buy:   { label: "À acheter",     emoji: "🛒", color: "bg-rose-100 text-rose-800 border-rose-300",           ring: "ring-rose-400" },
  owned:    { label: "Détenu",        emoji: "📦", color: "bg-amber-100 text-amber-800 border-amber-300",        ring: "ring-amber-400" },
  packed:   { label: "Dans mon sac",  emoji: "🎒", color: "bg-emerald-100 text-emerald-800 border-emerald-300",  ring: "ring-emerald-400" },
  ignored:  { label: "Ignorer",       emoji: "⏭️", color: "bg-slate-100 text-slate-600 border-slate-300",         ring: "ring-slate-400" },
};

const ORDER: PersoStatus[] = ["to_buy", "owned", "packed", "ignored"];

export function StockPersoMatrix({
  items,
  participants,
  checks,
}: {
  items: PersoStockItem[];
  participants: Participant[];
  checks: Check[];
}) {
  const { participantId } = useWhoAmI();
  const [optimistic, setOptimistic] = useState<Record<string, PersoStatus>>({});

  const checkKey = (pid: number, iid: number) => `${pid}-${iid}`;

  const initialMap = useMemo(() => {
    const m = new Map<string, PersoStatus>();
    checks.forEach((c) => {
      const s = isStatus(c.status) ? c.status : "to_buy";
      m.set(checkKey(c.participantId, c.persoStockItemId), s);
    });
    return m;
  }, [checks]);

  const getStatus = (pid: number, iid: number): PersoStatus => {
    const k = checkKey(pid, iid);
    if (k in optimistic) return optimistic[k];
    return initialMap.get(k) ?? "to_buy";
  };

  const myItems = items.map((i) => ({ item: i, status: getStatus(participantId!, i.id) }));
  const activeItems = myItems.filter((x) => x.status !== "ignored");
  const packedCount = myItems.filter((x) => x.status === "packed").length;
  const ownedCount = myItems.filter((x) => x.status === "owned").length;
  const toBuyCount = myItems.filter((x) => x.status === "to_buy").length;
  const ignoredCount = myItems.filter((x) => x.status === "ignored").length;

  const denominator = activeItems.length;
  const readyPct = denominator === 0 ? 0 : Math.round((packedCount / denominator) * 100);

  const onChange = (iid: number, newStatus: PersoStatus) => {
    const k = checkKey(participantId!, iid);
    setOptimistic((o) => ({ ...o, [k]: newStatus }));
  };

  return (
    <div className="space-y-4">
      {/* Hero progress */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <ProgressRing pct={readyPct} size={84} stroke={8} />
          <div className="flex-1">
            <div className="text-sm text-muted">Ta liste</div>
            <div className="text-2xl font-bold">
              {packedCount} / {denominator} dans ton sac
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              {toBuyCount > 0 && <Chip status="to_buy" count={toBuyCount} />}
              {ownedCount > 0 && <Chip status="owned" count={ownedCount} />}
              {packedCount > 0 && <Chip status="packed" count={packedCount} />}
              {ignoredCount > 0 && <Chip status="ignored" count={ignoredCount} />}
            </div>
          </div>
        </div>
      </div>

      {/* MY checklist */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">🎒 Ma liste</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemRow
                item={item}
                status={getStatus(participantId!, item.id)}
                onChange={(s) => onChange(item.id, s)}
                participantId={participantId!}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Group status */}
      <details className="bg-card rounded-2xl border border-border overflow-hidden">
        <summary className="px-4 py-3 font-semibold cursor-pointer flex items-center justify-between">
          <span>👥 Statut du groupe</span>
          <span className="text-sm text-muted font-normal">Qui a packé quoi</span>
        </summary>
        <div className="p-4 pt-2 space-y-2">
          {participants.map((p) => {
            const pPacked = items.filter((i) => getStatus(p.id, i.id) === "packed").length;
            const pActive = items.filter((i) => getStatus(p.id, i.id) !== "ignored").length;
            const pPct = pActive === 0 ? 0 : Math.round((pPacked / pActive) * 100);
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
                <div className="text-sm font-semibold tabular-nums text-muted">{pPacked}/{pActive}</div>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function ItemRow({
  item, status, onChange, participantId,
}: {
  item: PersoStockItem;
  status: PersoStatus;
  onChange: (s: PersoStatus) => void;
  participantId: number;
}) {
  const [pending, startTransition] = useTransition();
  const meta = STATUS_META[status];
  const dim = status === "ignored";

  const setStatus = (s: PersoStatus) => {
    onChange(s);
    startTransition(() => {
      setPersoStockStatus(participantId, item.id, s);
    });
  };

  return (
    <div
      className={`p-3 rounded-2xl border-2 transition ${meta.color} ${pending ? "opacity-60" : ""} ${dim ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl shrink-0" aria-hidden>{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${dim ? "line-through" : ""}`}>{item.name}</div>
          {item.notes && <div className="text-xs text-muted mt-0.5">{item.notes}</div>}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {ORDER.map((s) => {
          const sMeta = STATUS_META[s];
          const active = s === status;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={pending}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg text-[10px] font-medium transition border ${
                active
                  ? `${sMeta.color} ring-2 ${sMeta.ring} border-transparent`
                  : "bg-white/70 border-white text-slate-600 hover:bg-white"
              }`}
              aria-pressed={active}
            >
              <span className="text-base leading-none" aria-hidden>{sMeta.emoji}</span>
              <span className="leading-tight text-center">{sMeta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ status, count }: { status: PersoStatus; count: number }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${meta.color}`}>
      <span aria-hidden>{meta.emoji}</span>
      <span>{count} {meta.label}</span>
    </span>
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
