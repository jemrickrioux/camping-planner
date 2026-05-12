import { db, schema } from "@/lib/db";
import { getCurrentTrip, getConfirmedCount, getParticipants } from "@/lib/trip";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Countdown } from "@/components/countdown";

export const dynamic = "force-dynamic";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

export default async function DashboardPage() {
  const trip = await getCurrentTrip();
  const confirmedCount = await getConfirmedCount();
  const participants = await getParticipants();
  const totalParticipants = participants.length;
  const allConfirmed = confirmedCount === totalParticipants;

  const [communSansOwner] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.communStockItems)
    .where(sql`${schema.communStockItems.tripId} = ${trip.id} AND ${schema.communStockItems.ownerId} IS NULL AND ${schema.communStockItems.isGroup} = false`);

  const [todosOpen] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.todos)
    .where(sql`${schema.todos.tripId} = ${trip.id} AND ${schema.todos.status} != 'Fait'`);

  const siteCost = Number(trip.siteCost ?? 0);
  const rentalCost = Number(trip.rentalCost ?? 0);

  const [groceryCostRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${schema.groceryItems.cost}), 0)::text` })
    .from(schema.groceryItems)
    .where(eq(schema.groceryItems.tripId, trip.id));
  const groceryCost = Number(groceryCostRow.total ?? 0);

  const [drinksCostRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${schema.drinks.cost}), 0)::text` })
    .from(schema.drinks)
    .where(eq(schema.drinks.tripId, trip.id));
  const drinksCost = Number(drinksCostRow.total ?? 0);

  const totalCost = siteCost + rentalCost + groceryCost + drinksCost;

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
          <ActionCard href="/stock-perso" emoji="🎒" label="Mon stock" desc="Coche tes items" bg="from-amber-50 to-orange-50" />
          <ActionCard href="/stock-commun" emoji="📦" label="Stock commun" desc={`${communSansOwner.count ?? 0} sans owner`} bg="from-rose-50 to-pink-50" badge={communSansOwner.count ?? 0} />
          <ActionCard href="/epicerie" emoji="🛒" label="Épicerie" desc="Groupes d'achat" bg="from-emerald-50 to-teal-50" />
          <ActionCard href="/boissons" emoji="🍻" label="Boissons" desc="Pool partagé" bg="from-yellow-50 to-amber-50" />
        </div>
      </section>

      {/* COÛTS — adaptatif */}
      <CostsBlock
        siteCost={siteCost}
        rentalCost={rentalCost}
        groceryCost={groceryCost}
        drinksCost={drinksCost}
        totalCost={totalCost}
        confirmedCount={confirmedCount}
        totalParticipants={totalParticipants}
        allConfirmed={allConfirmed}
      />

      {/* INFO PRATIQUE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="📍 Site &amp; accès">
          <Row label="Réservation" value={`#${trip.reservationNo}`} />
          <Row label="Arrivée" value={`${trip.arrivalTime?.slice(0, 5)} le ${new Date(trip.startDate!).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric" })}`} />
          <Row label="Départ" value={`${trip.departureTime?.slice(0, 5)} le ${new Date(trip.endDate!).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric" })}`} />
          <Row label="Adresse" value={trip.contactAddress} />
        </Card>
        <Card title="📞 Parc — pour ravitaillement">
          <Row label="Téléphone" value={<a className="text-primary underline" href={`tel:${trip.contactPhone}`}>{trip.contactPhone}</a>} />
          <Row label="Email" value={<a className="text-primary underline" href={`mailto:${trip.contactEmail}`}>{trip.contactEmail}</a>} />
          <p className="text-xs text-muted pt-1">💡 Bateau-patrouille livre bois, glace, eau. Commander avant 11h le jour.</p>
        </Card>
      </section>

      {(todosOpen.count ?? 0) > 0 && (
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
              ? "On peut finaliser bouffe et lifts."
              : "Le coût par personne et la planif bouffe se précisent au fur et à mesure."}
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

function CostsBlock({
  siteCost, rentalCost, groceryCost, drinksCost, totalCost,
  confirmedCount, totalParticipants, allConfirmed,
}: {
  siteCost: number; rentalCost: number; groceryCost: number; drinksCost: number; totalCost: number;
  confirmedCount: number; totalParticipants: number; allConfirmed: boolean;
}) {
  // Show /pax only when all have confirmed; otherwise show estimated range
  const costPerPaxIfAll = totalParticipants > 0 ? totalCost / totalParticipants : 0;
  const costPerPaxIfConfirmed = confirmedCount > 0 ? totalCost / confirmedCount : 0;

  return (
    <section>
      <h2 className="text-base font-semibold mb-3 text-muted">💰 Coûts</h2>
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <CostItem label="Site (3 nuits)" value={siteCost} fixed />
          <CostItem label="Canots" value={rentalCost} fixed />
          <CostItem label="Épicerie" value={groceryCost} placeholder="À remplir" />
          <CostItem label="Boissons" value={drinksCost} placeholder="À remplir" />
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex justify-between items-baseline gap-3">
            <span className="text-sm text-muted">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatCurrency(totalCost)}</span>
          </div>
          {allConfirmed ? (
            <div className="flex justify-between items-baseline gap-3 mt-1">
              <span className="text-sm text-muted">/ personne ({totalParticipants})</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(costPerPaxIfAll)}</span>
            </div>
          ) : (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
              <div className="font-semibold text-amber-900 mb-1">
                ⏳ {confirmedCount}/{totalParticipants} confirmés — coût final calculé quand tous ont confirmé
              </div>
              <div className="text-amber-800">
                Estimé si tous viennent ({totalParticipants} pers) : <strong>{formatCurrency(costPerPaxIfAll)}</strong> / pers
              </div>
            </div>
          )}
        </div>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 items-start">
      <span className="text-muted shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function CostItem({ label, value, placeholder, fixed }: { label: string; value: number; placeholder?: string; fixed?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted flex items-center gap-1">
        {label}
        {fixed && <span title="Coût fixe">📌</span>}
      </div>
      <div className="text-lg font-semibold mt-1">
        {value === 0 && placeholder ? (
          <span className="text-muted text-sm font-normal">{placeholder}</span>
        ) : (
          formatCurrency(value)
        )}
      </div>
    </div>
  );
}
