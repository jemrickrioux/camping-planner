"use client";

import { useState, useTransition } from "react";
import type { Participant } from "@/db/schema";
import { updateLift } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";

type Role = "driver" | "passenger" | "self" | null;

export function LiftsView({ participants }: { participants: Participant[] }) {
  const { participantId, isOrganizer } = useWhoAmI();

  const drivers = participants.filter((p) => p.liftRole === "driver");
  const solo = participants.filter((p) => p.liftRole === "self");
  const unassigned = participants.filter((p) => !p.liftRole);

  // Total seats: sum drivers' seats. Total need: passengers (not solo, not unassigned).
  const totalSeats = drivers.reduce((sum, d) => sum + (d.liftSeats ?? 0), 0);
  const passengersCount = participants.filter((p) => p.liftRole === "passenger").length;

  return (
    <div className="space-y-5">
      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="🚗 Conducteurs" value={drivers.length} accent="primary" />
        <Stat label="🪑 Places offertes" value={totalSeats} accent="ok" />
        <Stat label="🧍 À placer" value={unassigned.length} accent={unassigned.length > 0 ? "warn" : "ok"} />
        <Stat label="🚙 Solo" value={solo.length} accent="muted" />
      </div>

      {/* DRIVERS' CARS */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-muted">🚗 Autos</h2>
        {drivers.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            Personne ne s'est encore offert pour conduire. Si tu peux conduire, choisis "🚗 Je conduis" sur ta carte.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {drivers.map((d) => {
              const passengers = participants.filter((p) => p.liftDriverId === d.id);
              const freeSeats = (d.liftSeats ?? 0) - passengers.length;
              return (
                <CarCard
                  key={d.id}
                  driver={d}
                  passengers={passengers}
                  freeSeats={freeSeats}
                  currentUserId={participantId!}
                  isOrganizer={isOrganizer}
                  allParticipants={participants}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* SOLO */}
      {solo.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-muted">🚙 Viennent par leurs propres moyens</h2>
          <div className="flex flex-wrap gap-2">
            {solo.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm">
                <Avatar name={p.name} size={20} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MY STATUS / UNASSIGNED LIST */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-muted">🧍 À placer ({unassigned.length})</h2>
        {unassigned.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-900">
            Tout le monde a un plan ! 🎉
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unassigned.map((p) => (
              <li key={p.id}>
                <UnassignedCard
                  participant={p}
                  drivers={drivers}
                  currentUserId={participantId!}
                  isOrganizer={isOrganizer}
                  allParticipants={participants}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CarCard({
  driver, passengers, freeSeats, currentUserId, isOrganizer, allParticipants,
}: {
  driver: Participant;
  passengers: Participant[];
  freeSeats: number;
  currentUserId: number;
  isOrganizer: boolean;
  allParticipants: Participant[];
}) {
  const isMyCar = driver.id === currentUserId;
  const canEditCar = isMyCar || isOrganizer;
  const [, startTransition] = useTransition();
  const [seats, setSeats] = useState(driver.liftSeats ?? 4);
  const [from, setFrom] = useState(driver.liftFrom ?? "");
  const [time, setTime] = useState(driver.liftTime ?? "");

  const save = (data: Partial<Participant>) => {
    startTransition(() => updateLift(driver.id, data as never));
  };

  const handleLeaveCar = (passengerId: number) => {
    startTransition(() => updateLift(passengerId, { liftRole: null, liftDriverId: null }));
  };

  const handleReleaseDriver = () => {
    if (!confirm("Annuler ton offre de conduire ? Les passagers seront aussi détachés.")) return;
    startTransition(() => {
      passengers.forEach((p) => updateLift(p.id, { liftRole: null, liftDriverId: null }));
      updateLift(driver.id, { liftRole: null, liftSeats: null, liftFrom: null, liftTime: null });
    });
  };

  // Other users can join if free seats
  const canJoin = !isMyCar && freeSeats > 0 && !allParticipants.find((p) => p.id === currentUserId)?.liftRole;
  const handleJoin = () => {
    startTransition(() => updateLift(currentUserId, { liftRole: "passenger", liftDriverId: driver.id }));
  };

  return (
    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 border-2 border-sky-200 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={driver.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="font-bold flex items-center gap-1">
            🚗 {driver.name}
            {isMyCar && <span className="text-xs text-sky-700">(ton auto)</span>}
          </div>
          <div className="text-xs text-muted">
            {passengers.length} passager{passengers.length > 1 ? "s" : ""} · {freeSeats} place{freeSeats !== 1 ? "s" : ""} libre{freeSeats !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <Field
          label="Places"
          value={String(seats)}
          onChange={(v) => setSeats(parseInt(v) || 0)}
          onSave={() => save({ liftSeats: seats })}
          type="number"
          editable={canEditCar}
        />
        <Field
          label="Départ"
          value={from}
          onChange={setFrom}
          onSave={() => save({ liftFrom: from })}
          placeholder="Ex: Mtl, Gatineau"
          editable={canEditCar}
        />
        <Field
          label="Heure"
          value={time}
          onChange={setTime}
          onSave={() => save({ liftTime: time })}
          placeholder="Ex: 11h"
          editable={canEditCar}
        />
      </div>

      {/* Passengers */}
      <div className="space-y-1.5">
        {passengers.map((p) => {
          const canLeave = p.id === currentUserId || isMyCar || isOrganizer;
          return (
            <div key={p.id} className="flex items-center gap-2 bg-white/60 rounded-lg px-2 py-1.5">
              <Avatar name={p.name} size={22} />
              <span className="flex-1 text-sm">{p.name}{p.id === currentUserId && " (toi)"}</span>
              {canLeave && (
                <button
                  onClick={() => handleLeaveCar(p.id)}
                  className="text-xs text-muted hover:text-rose-600"
                  title="Retirer de cette auto"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        {freeSeats > 0 &&
          Array.from({ length: freeSeats }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/30 rounded-lg px-2 py-1.5 text-muted text-xs">
              🪑 Place libre
            </div>
          ))}
      </div>

      <div className="flex gap-2 mt-3">
        {canJoin && (
          <button
            onClick={handleJoin}
            className="px-3 py-1.5 bg-sky-500 text-white rounded-full text-sm font-medium hover:bg-sky-600 transition"
          >
            🙋 J'embarque
          </button>
        )}
        {canEditCar && (
          <button
            onClick={handleReleaseDriver}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition"
          >
            Annuler mon offre
          </button>
        )}
      </div>
    </div>
  );
}

function UnassignedCard({
  participant, drivers, currentUserId, isOrganizer, allParticipants,
}: {
  participant: Participant;
  drivers: Participant[];
  currentUserId: number;
  isOrganizer: boolean;
  allParticipants: Participant[];
}) {
  const isMe = participant.id === currentUserId;
  const canEdit = isMe || isOrganizer;
  const [seats, setSeats] = useState(4);
  const [from, setFrom] = useState("");
  const [time, setTime] = useState("");
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [, startTransition] = useTransition();

  const handleBecomeDriver = () => {
    startTransition(() => updateLift(participant.id, {
      liftRole: "driver",
      liftSeats: seats,
      liftFrom: from,
      liftTime: time,
    }));
  };

  const handleGoSolo = () => {
    startTransition(() => updateLift(participant.id, { liftRole: "self" }));
  };

  const handleJoinDriver = (driverId: number) => {
    startTransition(() => updateLift(participant.id, { liftRole: "passenger", liftDriverId: driverId }));
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <Avatar name={participant.name} size={36} />
        <div className="font-medium">{participant.name}{isMe && <span className="ml-2 text-xs text-teal-700">(toi)</span>}</div>
      </div>

      {!canEdit ? (
        <p className="text-xs text-muted">En attente que {participant.name.split(" ")[0]} se décide.</p>
      ) : showDriverForm ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <label className="flex flex-col">
              <span className="text-xs text-muted">Places</span>
              <input type="number" min="1" max="6" value={seats} onChange={(e) => setSeats(parseInt(e.target.value) || 1)} className="px-2 py-1 border rounded" />
            </label>
            <label className="flex flex-col col-span-2">
              <span className="text-xs text-muted">Départ</span>
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Mtl, Gatineau…" className="px-2 py-1 border rounded" />
            </label>
            <label className="flex flex-col col-span-3">
              <span className="text-xs text-muted">Heure de départ</span>
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="11h00" className="px-2 py-1 border rounded" />
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBecomeDriver} className="px-3 py-1.5 bg-sky-500 text-white rounded-full text-sm font-medium hover:bg-sky-600">
              ✓ Confirmer
            </button>
            <button onClick={() => setShowDriverForm(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDriverForm(true)}
              className="px-3 py-1.5 bg-sky-500 text-white rounded-full text-sm font-medium hover:bg-sky-600"
            >
              🚗 Je conduis
            </button>
            <button
              onClick={handleGoSolo}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm hover:bg-slate-200"
            >
              🚙 Je viens seul
            </button>
          </div>
          {drivers.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-muted cursor-pointer hover:text-foreground">
                🙋 Embarquer dans une auto ({drivers.filter(d => (d.liftSeats ?? 0) - allParticipants.filter(p => p.liftDriverId === d.id).length > 0).length} dispo)
              </summary>
              <div className="space-y-1 mt-2">
                {drivers.map((d) => {
                  const taken = allParticipants.filter((p) => p.liftDriverId === d.id).length;
                  const free = (d.liftSeats ?? 0) - taken;
                  if (free <= 0) return null;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleJoinDriver(d.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 bg-sky-50 hover:bg-sky-100 rounded-lg text-sm text-left"
                    >
                      <Avatar name={d.name} size={20} />
                      <span>{d.name.split(" ")[0]}</span>
                      {d.liftFrom && <span className="text-xs text-muted">({d.liftFrom})</span>}
                      <span className="ml-auto text-xs text-muted">{free} place{free > 1 ? "s" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, onSave, placeholder, type = "text", editable,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  placeholder?: string;
  type?: string;
  editable: boolean;
}) {
  return (
    <label className="flex flex-col text-xs gap-0.5">
      <span className="text-muted">{label}</span>
      {editable ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
          placeholder={placeholder}
          className="px-2 py-1 bg-white/80 border border-transparent hover:border-border focus:border-primary rounded text-sm"
        />
      ) : (
        <span className="px-2 py-1 text-sm">{value || "—"}</span>
      )}
    </label>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent: "primary" | "ok" | "warn" | "muted" }) {
  const cls = {
    primary: "bg-sky-50 text-sky-900 border-sky-200",
    ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
    muted: "bg-slate-50 text-slate-700 border-slate-200",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
