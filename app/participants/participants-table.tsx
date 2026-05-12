"use client";

import { useState, useTransition } from "react";
import type { Participant } from "@/db/schema";
import { updateParticipant, updateArrivalDeparture, setCanManageGrocery } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";
import { formatPhone } from "@/lib/format";
import type { MealSlot } from "@/lib/meals";

export function ParticipantsTable({ participants, mealSlots }: { participants: Participant[]; mealSlots: MealSlot[] }) {
  const { participantId, isOrganizer } = useWhoAmI();
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {participants.map((p) => (
        <li key={p.id}>
          <Card
            participant={p}
            canEdit={p.id === participantId || isOrganizer}
            isMe={p.id === participantId}
            mealSlots={mealSlots}
          />
        </li>
      ))}
    </ul>
  );
}

function Card({ participant, canEdit, isMe, mealSlots }: { participant: Participant; canEdit: boolean; isMe: boolean; mealSlots: MealSlot[] }) {
  const { isOrganizer } = useWhoAmI();
  const [confirmed, setConfirmed] = useState(participant.confirmed);
  const [phone, setPhone] = useState(formatPhone(participant.phone));
  const [allergies, setAllergies] = useState(participant.allergies ?? "");
  const [arrival, setArrival] = useState(participant.arrivalMeal ?? "");
  const [departure, setDeparture] = useState(participant.departureMeal ?? "");
  const [canGrocery, setCanGrocery] = useState(participant.canManageGrocery);
  const [, startTransition] = useTransition();

  const save = (data: Partial<Participant>) => {
    startTransition(() => updateParticipant(participant.id, data as never));
  };

  const saveAD = (data: { arrivalMeal?: string | null; departureMeal?: string | null }) => {
    startTransition(() => updateArrivalDeparture(participant.id, data));
  };

  const toggleGrocery = () => {
    const v = !canGrocery;
    setCanGrocery(v);
    startTransition(() => setCanManageGrocery(participant.id, v));
  };

  const handlePhoneChange = (raw: string) => {
    setPhone(formatPhone(raw));
  };

  const confirmedColor =
    confirmed === "OUI" ? "bg-emerald-100 text-emerald-800"
    : confirmed === "NON" ? "bg-rose-100 text-rose-800"
    : "bg-amber-100 text-amber-800";

  const cardBorder =
    confirmed === "OUI" ? "border-emerald-200"
    : confirmed === "NON" ? "border-rose-200"
    : "border-amber-200";

  return (
    <div className={`bg-card rounded-2xl border-2 ${cardBorder} p-4 space-y-3`}>
      <div className="flex items-center gap-3">
        <Avatar name={participant.name} size={48} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {participant.name}
            {isMe && <span className="ml-2 text-xs text-teal-700">(toi)</span>}
            {participant.role === "organizer" && <span className="ml-1">👑</span>}
          </div>
          {canEdit ? (
            <select
              value={confirmed}
              onChange={(e) => { setConfirmed(e.target.value); save({ confirmed: e.target.value }); }}
              className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${confirmedColor}`}
            >
              <option value="?">? — Pas encore confirmé</option>
              <option value="OUI">OUI — Je viens</option>
              <option value="NON">NON — Je viens pas</option>
            </select>
          ) : (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${confirmedColor}`}>{confirmed}</span>
          )}
        </div>
      </div>

      {confirmed === "OUI" && (
        <div className="grid grid-cols-2 gap-2">
          <MealPicker
            label="🛬 Premier repas"
            value={arrival}
            onChange={(v) => { setArrival(v); saveAD({ arrivalMeal: v || null }); }}
            editable={canEdit}
            includeNone="Pas décidé"
            slots={mealSlots}
          />
          <MealPicker
            label="🛫 Dernier repas"
            value={departure}
            onChange={(v) => { setDeparture(v); saveAD({ departureMeal: v || null }); }}
            editable={canEdit}
            includeNone="Pas décidé"
            slots={mealSlots}
          />
        </div>
      )}

      <div className="space-y-2 text-sm">
        <Field
          label="📞"
          value={phone}
          onChange={handlePhoneChange}
          onSave={() => save({ phone })}
          placeholder="(XXX)XXX-XXXX"
          editable={canEdit}
        />
        <Field
          label="🚫"
          value={allergies}
          onChange={setAllergies}
          onSave={() => save({ allergies })}
          placeholder="Allergies / restrictions"
          editable={canEdit}
        />
      </div>

      {isOrganizer ? (
        <label className="flex items-center gap-2 text-sm border-t border-border pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={canGrocery}
            onChange={toggleGrocery}
            className="w-4 h-4 accent-emerald-600"
          />
          <span>🛒 Équipe épicerie</span>
          <span className="text-xs text-muted">— peut modifier la liste</span>
        </label>
      ) : participant.canManageGrocery ? (
        <div className="flex items-center gap-2 text-sm border-t border-border pt-2 text-emerald-700">
          🛒 <span>Équipe épicerie</span>
        </div>
      ) : null}
    </div>
  );
}

function MealPicker({
  label, value, onChange, editable, includeNone, slots,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  includeNone?: string;
  slots: MealSlot[];
}) {
  if (!editable) {
    const slot = slots.find((s) => s.key === value);
    return (
      <div className="text-sm">
        <div className="text-xs text-muted">{label}</div>
        <div className="font-medium">{slot ? `${slot.emoji} ${slot.label}` : "—"}</div>
      </div>
    );
  }
  return (
    <label className="text-sm">
      <span className="text-xs text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-0.5 px-2 py-1.5 border border-border rounded-md bg-white text-sm"
      >
        <option value="">{includeNone}</option>
        {slots.map((s) => (
          <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label, value, onChange, onSave, placeholder, editable,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  placeholder: string;
  editable: boolean;
}) {
  if (!editable) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <span className="opacity-60">{label}</span>
        <span>{value || "—"}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="opacity-60">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 bg-slate-50 border border-transparent hover:border-border focus:border-primary focus:bg-white rounded-md text-sm transition"
      />
    </div>
  );
}
