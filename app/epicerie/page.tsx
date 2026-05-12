import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants, getConfirmedCount } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { EpicerieTable } from "./epicerie-table";
import { AddGroceryForm } from "./add-grocery-form";
import { isAtMeal, getMealKey } from "@/lib/meals";

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
  qtyPerPerson: number; // average (info display)
  totalRaw: number;
  totalWithMargin: number;
  toBuy: number;
};

export default async function EpiceriePage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const confirmedCount = await getConfirmedCount();
  const totalParticipants = participants.length;

  const grocery = await db.select().from(schema.groceryItems)
    .where(eq(schema.groceryItems.tripId, trip.id))
    .orderBy(schema.groceryItems.position);

  // Per-meal attendance × menu items → per-item total quantity
  const menuRows = await db.select().from(schema.menuItems)
    .where(eq(schema.menuItems.tripId, trip.id));

  const itemTotals = new Map<string, number>();
  const itemAvgPerPerson = new Map<string, { sum: number; count: number }>();

  for (const row of menuRows) {
    const mealKey = getMealKey(row.day, row.meal);
    const attendees = participants.filter((p) => isAtMeal(p, mealKey)).length;
    const qpp = Number(row.qtyPerPerson);
    const rowTotal = qpp * attendees;
    itemTotals.set(row.item, (itemTotals.get(row.item) ?? 0) + rowTotal);
    const cur = itemAvgPerPerson.get(row.item) ?? { sum: 0, count: 0 };
    cur.sum += qpp;
    cur.count += 1;
    itemAvgPerPerson.set(row.item, cur);
  }

  const drinks = await db.select().from(schema.drinks)
    .where(eq(schema.drinks.tripId, trip.id))
    .orderBy(schema.drinks.position);

  const rows: EpicerieRow[] = grocery.map((g) => {
    const margin = Number(g.margin ?? 1.15);
    let totalRaw = 0;
    let qtyPerPersonDisplay = 0;
    if (g.source === "menu" && g.matchItem) {
      totalRaw = itemTotals.get(g.matchItem) ?? 0;
      const avg = itemAvgPerPerson.get(g.matchItem);
      qtyPerPersonDisplay = avg ? avg.sum : 0; // total / total-people equivalent shown as "qty pp"
    } else if (g.source === "fixed" && g.fixedQtyPerPerson) {
      qtyPerPersonDisplay = Number(g.fixedQtyPerPerson);
      totalRaw = qtyPerPersonDisplay * confirmedCount;
    }
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
      qtyPerPerson: qtyPerPersonDisplay,
      totalRaw,
      totalWithMargin,
      toBuy,
    };
  });

  drinks.forEach((d, idx) => {
    rows.push({
      id: 1000000 + d.id,
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

  const totalCost = rows.reduce((sum, r) => sum + Number(r.cost ?? 0), 0);
  const costPerPax = confirmedCount > 0 ? totalCost / confirmedCount : 0;
  const allConfirmed = confirmedCount === totalParticipants;
  const someoneNoArrival = participants.some((p) => p.confirmed === "OUI" && (!p.arrivalMeal || !p.departureMeal));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🛒 Épicerie</h1>
        <p className="text-muted text-sm">
          Calculée par <strong>présence à chaque repas</strong> : qté/pers × nb attendu au repas. Si quelqu'un arrive samedi midi, on cuisine pas pour lui le vendredi soir.
        </p>
      </div>

      {someoneNoArrival && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          ⚠ Certains confirmés n'ont pas encore choisi leur 🛬 premier et 🛫 dernier repas. Les quantités les considèrent comme présents partout (optimiste).
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Items" value={rows.length} accent="primary" />
        <Stat label="Total estimé" value={formatCurrency(totalCost)} accent="ok" hint={!allConfirmed ? `${confirmedCount}/${totalParticipants} confirmés` : undefined} />
        <Stat label="Coût / pers" value={allConfirmed ? formatCurrency(costPerPax) : "—"} accent="ok" hint={!allConfirmed ? "Attendre toutes confirmations" : undefined} />
      </div>

      <AddGroceryForm tripId={trip.id} />

      <EpicerieTable rows={rows} participants={participants} tripId={trip.id} />
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);
}

function Stat({ label, value, accent, hint }: { label: string; value: React.ReactNode; accent: "primary" | "ok"; hint?: string }) {
  const cls = {
    primary: "bg-teal-50 text-teal-900 border-teal-200",
    ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs opacity-70 mt-0.5">{hint}</div>}
    </div>
  );
}
