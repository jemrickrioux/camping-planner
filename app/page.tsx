import { db, schema } from "@/lib/db";
import { getCurrentTrip, getConfirmedCount, getParticipants } from "@/lib/trip";
import { isOrganizerSession } from "@/lib/auth";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { TripInfoCards } from "./trip-info-cards";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const trip = await getCurrentTrip();
  const confirmedCount = await getConfirmedCount();
  const participants = await getParticipants();
  const totalParticipants = participants.length;
  const allConfirmed = confirmedCount === totalParticipants;
  const isOrganizer = await isOrganizerSession();

  const [communSansOwner] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.communStockItems)
    .where(sql`${schema.communStockItems.tripId} = ${trip.id} AND ${schema.communStockItems.ownerId} IS NULL AND ${schema.communStockItems.isGroup} = false`);

  const [todosOpen] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.todos)
    .where(sql`${schema.todos.tripId} = ${trip.id} AND ${schema.todos.status} != 'Fait'`);


  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -top-10 -right-10 text-[200px] opacity-10 select-none">🏕️</div>
        <div className="relative">
          <div className="text-xs uppercase tracking-widest opacity-80 mb-1">{trip.destination}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{trip.site?.split(" — ")[1] ?? trip.site}</h1>
          <div className="text-lg opacity-90 mb-4">
            <Countdown target={`${trip.startDate}T${trip.arrivalTime}`} />
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Pill>📅 {new Date(trip.startDate!).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })} → {new Date(trip.endDate!).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}</Pill>
            <Pill>👥 {confirmedCount}/{totalParticipants} confirmés</Pill>
          </div>
        </div>
      </section>

      {/* CONFIRMATIONS — gros indicateur */}
      <ConfirmationsBlock participants={participants} confirmedCount={confirmedCount} />

      {/* QUICK ACTIONS — big */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-muted">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <ActionCard href="/lifts" emoji="🚗" label="Lifts" desc="Aller + retour" bg="from-sky-50 to-cyan-50" />
          <ActionCard href="/stock-perso" emoji="🎒" label="Stock perso" desc="Ta liste à toi" bg="from-amber-50 to-orange-50" />
          <ActionCard href="/stock-commun" emoji="📦" label="Stock commun" desc={`${communSansOwner.count ?? 0} sans owner`} bg="from-rose-50 to-pink-50" badge={communSansOwner.count ?? 0} />
          {isOrganizer && (
            <ActionCard href="/canots" emoji="🛶" label="Canots" desc="Location + placement" bg="from-teal-50 to-cyan-50" />
          )}
        </div>
      </section>

      {/* COÛT — cadeau + frais perso */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-muted">💰 Coût</h2>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <div className="text-4xl font-bold tabular-nums text-emerald-900">0 $</div>
          <div className="text-sm text-emerald-800 mt-1">+ ta bouffe et ta location de canot</div>
          <div className="text-xs text-emerald-700/80 mt-2">Thanks for joining the group :)</div>
        </div>
      </section>

      {/* INFO PRATIQUE — editable for organizer */}
      <TripInfoCards trip={trip} />

      {isOrganizer && (todosOpen.count ?? 0) > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-amber-900">⏳ {todosOpen.count} tâches à faire</div>
              <div className="text-sm text-amber-800">Vérifier le Plan d'action pour les détails et deadlines.</div>
            </div>
            <Link href="/plan-action" className="px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700">
              Ouvrir
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function ConfirmationsBlock({ participants, confirmedCount }: { participants: Awaited<ReturnType<typeof getParticipants>>; confirmedCount: number }) {
  const totalParticipants = participants.length;
  const pct = totalParticipants === 0 ? 0 : Math.round((confirmedCount / totalParticipants) * 100);
  const allConfirmed = confirmedCount === totalParticipants;

  return (
    <section className={`rounded-2xl border-2 p-4 md:p-5 ${
      allConfirmed
        ? "bg-emerald-50 border-emerald-300"
        : "bg-amber-50 border-amber-300"
    }`}>
      <div className="flex items-start gap-4 mb-3">
        <div className="text-3xl">{allConfirmed ? "✅" : "⏳"}</div>
        <div className="flex-1">
          <div className="font-bold text-lg">
            {allConfirmed
              ? "Tout le monde a confirmé !"
              : `${confirmedCount}/${totalParticipants} ont confirmé leur présence`}
          </div>
          <div className="text-sm opacity-80">
            {allConfirmed
              ? "On peut finaliser les lifts."
              : "Le coût par personne se précise au fur et à mesure."}
          </div>
        </div>
        <div className="text-3xl font-bold tabular-nums">{pct}%</div>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${allConfirmed ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {participants.map((p) => (
          <span
            key={p.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              p.confirmed === "OUI"
                ? "bg-emerald-100 text-emerald-900"
                : p.confirmed === "NON"
                ? "bg-rose-100 text-rose-900 line-through"
                : "bg-white/70 text-slate-600 border border-slate-200"
            }`}
          >
            {p.confirmed === "OUI" ? "✓" : p.confirmed === "NON" ? "✕" : "?"}
            {" "}{p.name.split(" ")[0]}
            {p.role === "organizer" && " 👑"}
          </span>
        ))}
      </div>
    </section>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm">
      {children}
    </span>
  );
}

function ActionCard({ href, emoji, label, desc, bg, badge }: { href: string; emoji: string; label: string; desc: string; bg: string; badge?: number }) {
  return (
    <Link
      href={href}
      className={`relative rounded-2xl border border-border p-4 hover:shadow-lg hover:-translate-y-0.5 transition bg-gradient-to-br ${bg}`}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-muted mt-0.5">{desc}</div>
      {!!badge && (
        <span className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-rose-500 text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

