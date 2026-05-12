"use client";

import { useState, useTransition } from "react";
import type { Canoe, CanoePaddler, Participant } from "@/db/schema";
import { addCanoe, updateCanoe, deleteCanoe, assignPaddler, unassignPaddler } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";
import { CANOE_CATALOG } from "@/lib/canoe-catalog";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

export function CanoesView({
  tripId, canoes, paddlers, participants,
}: {
  tripId: number;
  canoes: Canoe[];
  paddlers: CanoePaddler[];
  participants: Participant[];
}) {
  const { isOrganizer } = useWhoAmI();
  const confirmedParticipants = participants.filter((p) => p.confirmed === "OUI");
  const assignedIds = new Set(paddlers.map((p) => p.participantId));
  const unassigned = confirmedParticipants.filter((p) => !assignedIds.has(p.id));

  const totalCapacity = canoes.reduce((s, c) => s + c.capacity, 0);
  const totalCost = canoes.reduce((s, c) => s + Number(c.dailyRate) * c.days, 0);
  const taxed = totalCost * 1.15;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Canots" value={canoes.length} accent="primary" />
        <Stat label="Places" value={`${paddlers.length}/${totalCapacity}`} accent={paddlers.length === totalCapacity && totalCapacity >= confirmedParticipants.length ? "ok" : "warn"} />
        <Stat label="Confirmés à placer" value={unassigned.length} accent={unassigned.length === 0 ? "ok" : "warn"} />
        <Stat label="Total location" value={formatCurrency(totalCost)} accent="ok" hint={`taxes incl. ≈ ${formatCurrency(taxed)}`} />
      </div>

      {unassigned.length > 0 && canoes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
          <div className="font-semibold text-amber-900 mb-1.5">⏳ À placer dans un canot :</div>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-amber-200 rounded-full text-xs">
                <Avatar name={p.name} size={18} />
                {p.name.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {isOrganizer && <AddCanoeForm tripId={tripId} />}

      {canoes.length === 0 ? (
        <div className="bg-slate-50 border border-border rounded-2xl p-6 text-center text-muted">
          Aucun canot ajouté. {isOrganizer ? "Clique \"Ajouter un canot\" pour commencer." : "L'organisateur doit ajouter les canots."}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {canoes.map((c) => (
            <li key={c.id}>
              <CanoeCard
                canoe={c}
                paddlers={paddlers.filter((p) => p.canoeId === c.id)}
                participants={participants}
                unassigned={unassigned}
                isOrganizer={isOrganizer}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted">
        Tarifs du <a className="underline" href="https://poissonblanc.ca/informations/location-dembarcations/" target="_blank" rel="noreferrer">Parc régional du Poisson Blanc</a> · taxes en sus · jupettes, VFI, pagaies, écope inclus.
      </p>
    </div>
  );
}

function AddCanoeForm({ tripId }: { tripId: number }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>(CANOE_CATALOG[0].type);
  const [, startTransition] = useTransition();

  const entry = CANOE_CATALOG.find((c) => c.type === type) ?? CANOE_CATALOG[0];

  const submit = () => {
    startTransition(async () => {
      await addCanoe(tripId, {
        type: entry.type,
        capacity: entry.capacity,
        dailyRate: entry.dailyRate,
        days: 4,
      });
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90"
      >
        <span className="text-lg leading-none">+</span> Ajouter un canot
      </button>
    );
  }

  return (
    <div className="bg-card border-2 border-primary rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Ajouter un canot</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none">✕</button>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 border border-border rounded-lg bg-white">
          {CANOE_CATALOG.map((c) => (
            <option key={c.type} value={c.type}>
              {c.type} — {formatCurrency(Number(c.dailyRate))}/jour · {c.capacity} place{c.capacity > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="text-sm bg-sky-50 border border-sky-200 rounded-lg p-2 flex justify-between">
        <span><strong>{entry.capacity}</strong> place{entry.capacity > 1 ? "s" : ""}</span>
        <span><strong>{formatCurrency(Number(entry.dailyRate))}</strong>/jour × 4 jours = <strong>{formatCurrency(Number(entry.dailyRate) * 4)}</strong></span>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium">Ajouter</button>
        <button onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm">Annuler</button>
      </div>
    </div>
  );
}

function CanoeCard({
  canoe, paddlers, participants, unassigned, isOrganizer,
}: {
  canoe: Canoe;
  paddlers: CanoePaddler[];
  participants: Participant[];
  unassigned: Participant[];
  isOrganizer: boolean;
}) {
  const [days, setDays] = useState(canoe.days);
  const [rate, setRate] = useState(canoe.dailyRate);
  const [, startTransition] = useTransition();

  const assignedPaddlers = paddlers
    .map((p) => participants.find((part) => part.id === p.participantId))
    .filter((p): p is Participant => !!p);
  const freeSeats = canoe.capacity - assignedPaddlers.length;

  const totalForCanoe = Number(rate) * days;

  const handleDelete = () => {
    if (!confirm(`Supprimer ce ${canoe.type} ?`)) return;
    startTransition(() => deleteCanoe(canoe.id));
  };

  const handleAdd = (pid: number) => {
    startTransition(() => assignPaddler(canoe.id, pid));
  };

  const handleRemove = (pid: number) => {
    startTransition(() => unassignPaddler(canoe.id, pid));
  };

  return (
    <div className={`rounded-2xl border-2 p-4 space-y-3 ${
      freeSeats === 0 ? "bg-emerald-50 border-emerald-200" : "bg-sky-50 border-sky-200"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold">🛶 {canoe.type}</div>
          <div className="text-xs text-muted">
            {canoe.capacity} place{canoe.capacity > 1 ? "s" : ""} · {freeSeats > 0 ? `${freeSeats} libre${freeSeats > 1 ? "s" : ""}` : "complet ✓"}
          </div>
        </div>
        {isOrganizer && (
          <button onClick={handleDelete} className="text-xs text-rose-500 hover:text-rose-700">✕</button>
        )}
      </div>

      {/* Paddlers */}
      <div className="space-y-1.5">
        {assignedPaddlers.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1.5">
            <Avatar name={p.name} size={22} />
            <span className="flex-1 text-sm">{p.name}</span>
            <button onClick={() => handleRemove(p.id)} className="text-xs text-muted hover:text-rose-600">✕</button>
          </div>
        ))}
        {Array.from({ length: freeSeats }).map((_, i) => (
          <div key={i} className="bg-white/30 rounded-lg px-2 py-1.5 text-muted text-xs">🪑 Place libre</div>
        ))}
      </div>

      {/* Quick assign unassigned */}
      {freeSeats > 0 && unassigned.length > 0 && (
        <details>
          <summary className="text-xs text-muted cursor-pointer hover:text-foreground">+ Ajouter un pagayeur</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unassigned.slice(0, freeSeats > 0 ? unassigned.length : 0).map((p) => (
              <button key={p.id} onClick={() => handleAdd(p.id)} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-border rounded-full text-xs hover:border-primary">
                <Avatar name={p.name} size={16} />
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Pricing */}
      <div className="flex items-center gap-2 text-sm border-t border-white/60 pt-2">
        {isOrganizer ? (
          <>
            <label className="flex items-center gap-1 text-xs">
              <span className="text-muted">$</span>
              <input
                type="number" step="0.01" value={rate}
                onChange={(e) => setRate(e.target.value)}
                onBlur={() => startTransition(() => updateCanoe(canoe.id, { dailyRate: rate }))}
                className="w-16 px-1.5 py-0.5 border border-border rounded text-right bg-white"
              />
              <span className="text-muted">/jour</span>
            </label>
            <span className="text-muted">×</span>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="number" min="1" value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                onBlur={() => startTransition(() => updateCanoe(canoe.id, { days }))}
                className="w-12 px-1.5 py-0.5 border border-border rounded text-center bg-white"
              />
              <span className="text-muted">jours</span>
            </label>
          </>
        ) : (
          <span className="text-xs text-muted">{formatCurrency(Number(rate))}/jour × {days} jours</span>
        )}
        <span className="ml-auto font-bold tabular-nums">{formatCurrency(totalForCanoe)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, hint }: { label: string; value: React.ReactNode; accent: "primary" | "ok" | "warn"; hint?: string }) {
  const cls = {
    primary: "bg-sky-50 text-sky-900 border-sky-200",
    ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs opacity-70 mt-0.5">{hint}</div>}
    </div>
  );
}
