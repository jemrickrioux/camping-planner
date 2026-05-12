"use client";

import { createContext, useContext, useState, useTransition, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Participant } from "@/db/schema";
import { selectParticipant, clearSession } from "@/app/actions";

type WhoAmICtx = {
  participantId: number | null;
  participant: Participant | null;
  isOrganizer: boolean;
  canManageGrocery: boolean;
  participants: Participant[];
  logout: () => void;
};

const Ctx = createContext<WhoAmICtx | null>(null);

export function WhoAmIProvider({
  participants,
  currentParticipantId,
  isOrganizer,
  children,
}: {
  participants: Participant[];
  currentParticipantId: number | null;
  isOrganizer: boolean;
  children: ReactNode;
}) {
  const router = useRouter();

  const participant = currentParticipantId
    ? participants.find((p) => p.id === currentParticipantId) ?? null
    : null;

  if (!participant) {
    return <Picker participants={participants} onDone={() => router.refresh()} />;
  }

  const canManageGrocery = isOrganizer || !!participant.canManageGrocery;

  const logout = async () => {
    await clearSession();
    router.refresh();
  };

  return (
    <Ctx.Provider
      value={{
        participantId: participant.id,
        participant,
        isOrganizer,
        canManageGrocery,
        participants,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWhoAmI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWhoAmI must be used inside WhoAmIProvider");
  return ctx;
}

function Picker({ participants, onDone }: { participants: Participant[]; onDone: () => void }) {
  const [pickedOrganizer, setPickedOrganizer] = useState<Participant | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [pending, startTransition] = useTransition();

  const pickParticipant = (p: Participant) => {
    setErr("");
    if (p.role === "organizer") {
      setPickedOrganizer(p);
      setPin("");
      return;
    }
    startTransition(async () => {
      const res = await selectParticipant(p.id);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onDone();
    });
  };

  const submitPin = () => {
    if (!pickedOrganizer) return;
    setErr("");
    startTransition(async () => {
      const res = await selectParticipant(pickedOrganizer.id, pin);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onDone();
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-emerald-50 to-amber-50">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-6 border border-border">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🛶</div>
          <h1 className="text-2xl font-bold">Canot Camping</h1>
          <p className="text-muted text-sm mt-1">Poisson Blanc — Juin 2026</p>
        </div>

        {pickedOrganizer ? (
          <div className="space-y-3">
            <p className="text-sm text-center">
              👑 <span className="font-medium">{pickedOrganizer.name}</span>
              <br />
              <span className="text-muted text-xs">PIN organisateur requis</span>
            </p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitPin(); }}
              placeholder="PIN"
              className="w-full px-4 py-3 border border-border rounded-xl bg-white text-center text-lg tracking-widest"
            />
            {err && <p className="text-sm text-rose-600 text-center">{err}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setPickedOrganizer(null); setPin(""); setErr(""); }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={submitPin}
                disabled={pending || !pin}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-50"
              >
                {pending ? "..." : "Continuer"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium mb-3 text-center text-muted">T'es qui ?</p>
            <div className="space-y-2">
              {participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickParticipant(p)}
                  disabled={pending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-teal-50 transition-colors font-medium disabled:opacity-50"
                >
                  <Avatar name={p.name} />
                  <span className="flex-1 text-left">{p.name}</span>
                  {p.role === "organizer" && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                      🔒 Organisateur
                    </span>
                  )}
                </button>
              ))}
            </div>
            {err && <p className="text-sm text-rose-600 text-center mt-3">{err}</p>}
            <p className="text-xs text-muted text-center mt-4">Ton choix est sauvegardé dans le navigateur.</p>
          </>
        )}
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
  const { participant, isOrganizer, logout } = useWhoAmI();
  if (!participant) return null;
  return (
    <button
      onClick={() => {
        if (confirm("Changer d'utilisateur ?")) logout();
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
