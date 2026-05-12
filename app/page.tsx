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

  const [communStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withOwner: sql<number>`sum(case when ${schema.communStockItems.ownerId} is not null or ${schema.communStockItems.isGroup} = true then 1 else 0 end)::int`,
      confirmed: sql<number>`sum(case when ${schema.communStockItems.confirmed} = true then 1 else 0 end)::int`,
    })
    .from(schema.communStockItems)
    .where(eq(schema.communStockItems.tripId, trip.id));

  const [groceryStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      withBuyer: sql<number>`sum(case when ${schema.groceryItems.buyerId} is not null then 1 else 0 end)::int`,
      confirmed: sql<number>`sum(case when ${schema.groceryItems.confirmed} = true then 1 else 0 end)::int`,
    })
    .from(schema.groceryItems)
    .where(eq(schema.groceryItems.tripId, trip.id));

  const [todosOpen] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.todos)
    .where(sql`${schema.todos.tripId} = ${trip.id} AND ${schema.todos.status} != 'Fait'`);

  const siteCost = Number(trip.siteCost ?? 0);
  const rentalCost = Number(trip.rentalCost ?? 0);

  // Dynamic costs from grocery + drinks
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
  const costPerPax = confirmedCount > 0 ? totalCost / confirmedCount : 0;

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
            <Pill>👥 {confirmedCount}/8 confirmés</Pill>
            <Pill>💰 {formatCurrency(costPerPax)} / pers</Pill>
          </div>
        </div>
      </section>

      {/* PROGRESS RINGS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Progress
          label="Stock commun"
          value={communStats.withOwner ?? 0}
          total={communStats.total}
          unit="owners"
          href="/stock-commun"
          color="teal"
        />
        <Progress
          label="Stock commun"
          value={communStats.confirmed ?? 0}
          total={communStats.total}
          unit="confirmés"
          href="/stock-commun"
          color="emerald"
        />
        <Progress
          label="Épicerie"
          value={groceryStats.withBuyer ?? 0}
          total={groceryStats.total}
          unit="acheteurs"
          href="/epicerie"
          color="amber"
        />
        <Progress
          label="Plan d'action"
          value={(todosOpen.count ? 19 - todosOpen.count : 19)}
          total={19}
          unit="fait"
          href="/plan-action"
          color="sky"
        />
      </section>

      {/* QUICK ACTIONS — big */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-muted">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <ActionCard href="/lifts" emoji="🚗" label="Lifts" desc="Qui embarque avec qui" bg="from-sky-50 to-cyan-50" />
          <ActionCard href="/stock-perso" emoji="🎒" label="Mon stock" desc={`${30} items à cocher`} bg="from-amber-50 to-orange-50" />
          <ActionCard href="/stock-commun" emoji="📦" label="Stock commun" desc={`${communStats.total - (communStats.withOwner ?? 0)} sans owner`} bg="from-rose-50 to-pink-50" />
          <ActionCard href="/epicerie" emoji="🛒" label="Épicerie" desc={`${groceryStats.total} items`} bg="from-emerald-50 to-teal-50" />
          <ActionCard href="/boissons" emoji="🍻" label="Boissons" desc="Pool partagé" bg="from-yellow-50 to-amber-50" />
        </div>
      </section>

      {/* COÛTS LIVE */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-muted">💰 Coûts (live, se met à jour quand on remplit l'épicerie)</h2>
        <div className="bg-card rounded-2xl border border-border p-4 grid grid-cols-1 sm:grid-cols-5 gap-4">
          <CostItem label="Site (3 nuits)" value={siteCost} fixed />
          <CostItem label="Canots (4 jours)" value={rentalCost} fixed />
          <CostItem label="Épicerie" value={groceryCost} placeholder="À remplir" />
          <CostItem label="Boissons" value={drinksCost} placeholder="À remplir" />
          <div className="border-l-0 sm:border-l border-border pl-0 sm:pl-4">
            <div className="text-xs uppercase tracking-wide text-muted">Total / personne</div>
            <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(costPerPax)}</div>
            <div className="text-xs text-muted">basé sur {confirmedCount} confirmé{confirmedCount > 1 ? "s" : ""}</div>
          </div>
        </div>
      </section>

      {/* INFO PRATIQUE */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="📍 Site & accès">
          <Row label="Réservation" value={`#${trip.reservationNo}`} />
          <Row label="Arrivée" value={`${trip.arrivalTime?.slice(0, 5)} le ${new Date(trip.startDate!).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric" })}`} />
          <Row label="Départ" value={`${trip.departureTime?.slice(0, 5)} le ${new Date(trip.endDate!).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric" })}`} />
          <Row label="Adresse" value={trip.contactAddress} />
        </Card>
        <Card title="📞 Parc — pour ravitaillement">
          <Row label="Téléphone" value={<a className="text-primary underline" href={`tel:${trip.contactPhone}`}>{trip.contactPhone}</a>} />
          <Row label="Email" value={<a className="text-primary underline" href={`mailto:${trip.contactEmail}`}>{trip.contactEmail}</a>} />
          <p className="text-xs text-muted pt-1">💡 Le bateau-patrouille livre bois, glace et eau sur l'île. Commander avant 11h le jour même.</p>
        </Card>
      </section>

      {/* PARTICIPANTS */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-muted">👥 L'équipage ({confirmedCount}/8)</h2>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                p.confirmed === "OUI"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              {p.role === "organizer" && "👑 "}
              {p.name.split(" ")[0]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm">
      {children}
    </span>
  );
}

function Progress({
  label, value, total, unit, href, color,
}: {
  label: string;
  value: number;
  total: number;
  unit: string;
  href: string;
  color: "teal" | "emerald" | "amber" | "sky";
}) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const colors = {
    teal: { ring: "stroke-teal-500", bg: "stroke-teal-100", text: "text-teal-700" },
    emerald: { ring: "stroke-emerald-500", bg: "stroke-emerald-100", text: "text-emerald-700" },
    amber: { ring: "stroke-amber-500", bg: "stroke-amber-100", text: "text-amber-700" },
    sky: { ring: "stroke-sky-500", bg: "stroke-sky-100", text: "text-sky-700" },
  }[color];

  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - pct / 100);

  return (
    <Link
      href={href}
      className="bg-card rounded-2xl border border-border p-4 hover:border-primary hover:shadow-lg transition flex items-center gap-3"
    >
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0 -rotate-90">
        <circle cx="32" cy="32" r="28" className={colors.bg} strokeWidth="6" fill="none" />
        <circle
          cx="32" cy="32" r="28" className={colors.ring} strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
        <text x="32" y="32" textAnchor="middle" dominantBaseline="middle" className={`${colors.text} font-bold text-sm rotate-90`} style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>
          {pct}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted truncate">{label}</div>
        <div className="font-semibold text-sm">
          {value}/{total} <span className="text-muted font-normal">{unit}</span>
        </div>
      </div>
    </Link>
  );
}

function ActionCard({ href, emoji, label, desc, bg }: { href: string; emoji: string; label: string; desc: string; bg: string }) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border border-border p-4 hover:shadow-lg hover:-translate-y-0.5 transition bg-gradient-to-br ${bg}`}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-muted mt-0.5">{desc}</div>
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
        {fixed && <span title="Coût fixe" className="text-amber-600">📌</span>}
      </div>
      <div className="text-lg font-semibold mt-1">
        {value === 0 && placeholder ? (
          <span className="text-muted text-sm font-normal">{placeholder}</span>
        ) : (
          new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value)
        )}
      </div>
    </div>
  );
}
