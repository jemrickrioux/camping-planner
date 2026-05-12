import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants, getConfirmedCount } from "@/lib/trip";
import { eq, sql } from "drizzle-orm";
import { EpicerieTable } from "./epicerie-table";

export const dynamic = "force-dynamic";

export type EpicerieRow = {
  id: number;
  position: number;
  section: string;
  name: string;
  unit: string | null;
  source: string;
  matchItem: string | null;
  fixedQtyPerPerson: string | null;
  fixedText: string | null;
  margin: string | null;
  buyerId: number | null;
  cost: string | null;
  confirmed: boolean | null;
  notes: string | null;
  qtyPerPerson: number; // computed
  totalRaw: number;
  totalWithMargin: number;
  toBuy: number;
};

export default async function EpiceriePage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const confirmedCount = await getConfirmedCount();

  // Get grocery items
  const grocery = await db.select().from(schema.groceryItems)
    .where(eq(schema.groceryItems.tripId, trip.id))
    .orderBy(schema.groceryItems.position);

  // Compute qty/pers from menu via SUMIFS-like aggregation
  const menuSums = await db
    .select({
      item: schema.menuItems.item,
      total: sql<number>`SUM(${schema.menuItems.qtyPerPerson})::numeric::float8`,
    })
    .from(schema.menuItems)
    .where(eq(schema.menuItems.tripId, trip.id))
    .groupBy(schema.menuItems.item);
  const menuMap = new Map(menuSums.map((m) => [m.item, Number(m.total)]));

  // Drinks (pool) — appended as additional epicerie rows
  const drinks = await db.select().from(schema.drinks)
    .where(eq(schema.drinks.tripId, trip.id))
    .orderBy(schema.drinks.position);

  // Build computed rows
  const rows: EpicerieRow[] = grocery.map((g) => {
    const margin = Number(g.margin ?? 1.15);
    let qtyPerPerson = 0;
    if (g.source === "menu" && g.matchItem) {
      qtyPerPerson = menuMap.get(g.matchItem) ?? 0;
    } else if (g.source === "fixed" && g.fixedQtyPerPerson) {
      qtyPerPerson = Number(g.fixedQtyPerPerson);
    }
    const totalRaw = qtyPerPerson * confirmedCount;
    const totalWithMargin = totalRaw * margin;
    const toBuy = Math.ceil(totalWithMargin);
    return {
      id: g.id,
      position: g.position,
      section: g.section,
      name: g.name,
      unit: g.unit,
      source: g.source,
      matchItem: g.matchItem,
      fixedQtyPerPerson: g.fixedQtyPerPerson,
      fixedText: g.fixedText,
      margin: g.margin,
      buyerId: g.buyerId,
      cost: g.cost,
      confirmed: g.confirmed,
      notes: g.notes,
      qtyPerPerson,
      totalRaw,
      totalWithMargin,
      toBuy,
    };
  });

  // Pool drinks → appended as virtual rows
  drinks.forEach((d, idx) => {
    rows.push({
      id: 1000000 + d.id, // synthetic
      position: 10000 + idx,
      section: "Boissons (pool)",
      name: d.item,
      unit: d.format,
      source: "drink",
      matchItem: null,
      fixedQtyPerPerson: null,
      fixedText: null,
      margin: "1.000",
      buyerId: d.ownerId,
      cost: d.cost,
      confirmed: d.confirmed,
      notes: `${d.category} — pool partagé / ${confirmedCount} pax`,
      qtyPerPerson: 0,
      totalRaw: d.quantity ?? 0,
      totalWithMargin: d.quantity ?? 0,
      toBuy: d.quantity ?? 0,
    });
  });

  // Totals
  const totalCost = rows.reduce((sum, r) => sum + Number(r.cost ?? 0), 0);
  const costPerPax = confirmedCount > 0 ? totalCost / confirmedCount : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🛒 Épicerie</h1>
        <p className="text-muted text-sm">
          Liste consolidée — calculée du menu × {confirmedCount} pax × marge 15%. Modifier le Menu = recalcul automatique.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Items" value={rows.length} accent="primary" />
        <Stat label="Total estimé" value={formatCurrency(totalCost)} accent="ok" />
        <Stat label="Coût / pers" value={formatCurrency(costPerPax)} accent="ok" />
      </div>

      <EpicerieTable rows={rows} participants={participants} />
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent: "primary" | "ok" }) {
  const cls = {
    primary: "bg-teal-50 text-teal-900 border-teal-200",
    ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
