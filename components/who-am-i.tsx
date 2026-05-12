"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Participant } from "@/db/schema";

type WhoAmICtx = {
  participantId: number | null;
  participant: Participant | null;
  isOrganizer: boolean;
  setParticipantId: (id: number | null) => void;
  participants: Participant[];
};

const Ctx = createContext<WhoAmICtx | null>(null);

const STORAGE_KEY = "camping-participant-id";

export function WhoAmIProvider({ participants, children }: { participants: Participant[]; children: ReactNode }) {
  const [participantId, setParticipantIdState] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const id = parseInt(stored, 10);
      if (participants.find((p) => p.id === id)) {
        setParticipantIdState(id);
      }
    }
    setHydrated(true);
  }, [participants]);

  const setParticipantId = (id: number | null) => {
    setParticipantIdState(id);
    if (id === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(id));
    }
  };

  const participant = participantId ? participants.find((p) => p.id === participantId) || null : null;
  const isOrganizer = participant?.role === "organizer";

  if (!hydrated) {
    return <div className="min-h-screen flex items-center justify-center text-muted">Chargement…</div>;
  }

  if (!participantId) {
    return <Picker participants={participants} onPick={setParticipantId} />;
  }

  return (
    <Ctx.Provider value={{ participantId, participant, isOrganizer, setParticipantId, participants }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWhoAmI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWhoAmI must be used inside WhoAmIProvider");
  return ctx;
}

function Picker({ participants, onPick }: { participants: Participant[]; onPick: (id: number) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-emerald-50 to-amber-50">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-6 border border-border">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🛶</div>
          <h1 className="text-2xl font-bold">Canot Camping</h1>
          <p className="text-muted text-sm mt-1">Poisson Blanc — Juin 2026</p>
        </div>
        <p className="text-sm font-medium mb-3 text-center text-muted">T'es qui ?</p>
        <div className="space-y-2">
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-teal-50 transition-colors font-medium"
            >
              <Avatar name={p.name} />
              <span className="flex-1 text-left">{p.name}</span>
              {p.role === "organizer" && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                  Organisateur
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-4">Ton choix est sauvegardé dans le navigateur.</p>
      </div>
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
  // Deterministic color from name
  const hue = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue}, 55%, 45%)`,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </span>
  );
}

export function WhoAmIBadge() {
  const { participant, isOrganizer, setParticipantId } = useWhoAmI();
  if (!participant) return null;
  return (
    <button
      onClick={() => {
        if (confirm("Changer d'utilisateur ?")) setParticipantId(null);
      }}
      className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-card border border-border text-sm hover:border-primary transition"
      title="Changer d'utilisateur"
    >
      <Avatar name={participant.name} size={26} />
      <span className="font-medium hidden sm:inline">{participant.name.split(" ")[0]}</span>
      {isOrganizer && <span className="text-xs">👑</span>}
    </button>
  );
}
