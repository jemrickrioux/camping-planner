"use client";

import { useState, useTransition } from "react";
import type { Participant } from "@/db/schema";
import { updateParticipant } from "@/app/actions";
import { useWhoAmI, Avatar } from "@/components/who-am-i";
import { formatPhone } from "@/lib/format";

export function ParticipantsTable({ participants }: { participants: Participant[] }) {
  const { participantId, isOrganizer } = useWhoAmI();
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {participants.map((p) => (
        <li key={p.id}>
          <Card participant={p} canEdit={p.id === participantId || isOrganizer} isMe={p.id === participantId} />
        </li>
      ))}
    </ul>
  );
}

function Card({ participant, canEdit, isMe }: { participant: Participant; canEdit: boolean; isMe: boolean }) {
  const [confirmed, setConfirmed] = useState(participant.confirmed);
  const [phone, setPhone] = useState(formatPhone(participant.phone));
  const [allergies, setAllergies] = useState(participant.allergies ?? "");
  const [, startTransition] = useTransition();

  const save = (data: Partial<Participant>) => {
    startTransition(() => updateParticipant(participant.id, data as never));
  };

  const handlePhoneChange = (raw: string) => {
    setPhone(formatPhone(raw));
  };

  const confirmedColor =
    confirmed === "OUI"
      ? "bg-emerald-100 text-emerald-800"
      : confirmed === "NON"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";

  const cardBorder =
    confirmed === "OUI" ? "border-emerald-200" : confirmed === "NON" ? "border-rose-200" : "border-amber-200";

  return (
    <div className={`bg-card rounded-2xl border-2 ${cardBorder} p-4`}>
      <div className="flex items-center gap-3 mb-3">
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
              <option value="OUI">OUI</option>
              <option value="NON">NON</option>
              <option value="?">?</option>
            </select>
          ) : (
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${confirmedColor}`}>{confirmed}</span>
          )}
        </div>
      </div>

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
    </div>
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
