"use client";

import { useState, useTransition } from "react";
import type { Trip } from "@/db/schema";
import { updateTrip } from "./actions";
import { useWhoAmI } from "@/components/who-am-i";
import { formatPhone } from "@/lib/format";

export function TripInfoCards({ trip }: { trip: Trip }) {
  const { isOrganizer } = useWhoAmI();
  const [, startTransition] = useTransition();

  const save = (data: Parameters<typeof updateTrip>[1]) => {
    startTransition(() => updateTrip(trip.id, data));
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="📍 Site &amp; accès">
        <EditableRow label="Destination" value={trip.destination ?? ""} onSave={(v) => save({ destination: v })} editable={isOrganizer} />
        <EditableRow label="Site" value={trip.site ?? ""} onSave={(v) => save({ site: v })} editable={isOrganizer} />
        <EditableRow label="Réservation #" value={trip.reservationNo ?? ""} onSave={(v) => save({ reservationNo: v })} editable={isOrganizer} />
        <EditableRow label="Adresse" value={trip.contactAddress ?? ""} onSave={(v) => save({ contactAddress: v })} editable={isOrganizer} />
        <EditableRow label="Arrivée (date)" value={trip.startDate ?? ""} onSave={(v) => save({ startDate: v })} editable={isOrganizer} type="date" />
        <EditableRow label="Arrivée (heure)" value={trip.arrivalTime?.slice(0, 5) ?? ""} onSave={(v) => save({ arrivalTime: v })} editable={isOrganizer} type="time" />
        <EditableRow label="Départ (date)" value={trip.endDate ?? ""} onSave={(v) => save({ endDate: v })} editable={isOrganizer} type="date" />
        <EditableRow label="Départ (heure)" value={trip.departureTime?.slice(0, 5) ?? ""} onSave={(v) => save({ departureTime: v })} editable={isOrganizer} type="time" />
      </Card>

      <Card title="📞 Parc — pour ravitaillement">
        <EditableRow
          label="Téléphone"
          value={trip.contactPhone ?? ""}
          display={(v) => v ? <a className="text-primary underline" href={`tel:${v}`}>{formatPhone(v)}</a> : "—"}
          onSave={(v) => save({ contactPhone: v })}
          editable={isOrganizer}
          format={(v) => formatPhone(v)}
        />
        <EditableRow
          label="Email"
          value={trip.contactEmail ?? ""}
          display={(v) => v ? <a className="text-primary underline" href={`mailto:${v}`}>{v}</a> : "—"}
          onSave={(v) => save({ contactEmail: v })}
          editable={isOrganizer}
          type="email"
        />
        <p className="text-xs text-muted pt-1">💡 Bateau-patrouille livre bois, glace, eau. Commander avant 11h le jour.</p>
      </Card>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function EditableRow({
  label, value, onSave, editable, display, type = "text", format,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  editable: boolean;
  display?: (v: string) => React.ReactNode;
  type?: "text" | "date" | "time" | "email";
  format?: (v: string) => string;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) onSave(localValue);
  };

  if (!editable) {
    return (
      <div className="flex justify-between gap-3 items-start">
        <span className="text-muted shrink-0">{label}</span>
        <span className="text-right font-medium">{display ? display(value) : (value || "—")}</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex justify-between gap-3 items-center">
        <span className="text-muted shrink-0">{label}</span>
        <input
          type={type}
          value={localValue}
          autoFocus
          onChange={(e) => setLocalValue(format ? format(e.target.value) : e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setLocalValue(value); setIsEditing(false); } }}
          className="text-right px-2 py-0.5 border border-primary rounded-md bg-white text-sm flex-1 min-w-0"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-full flex justify-between gap-3 items-start text-left rounded-md hover:bg-slate-50 px-1 -mx-1 transition cursor-text group"
      title="Cliquer pour modifier"
    >
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-right font-medium flex items-center gap-1">
        <span>{display ? display(value) : (value || "—")}</span>
        <span className="opacity-0 group-hover:opacity-60 text-xs">✎</span>
      </span>
    </button>
  );
}
