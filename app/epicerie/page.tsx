import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants, getConfirmedCount, getMealSlots } from "@/lib/trip";
import { getCurrentParticipant } from "@/lib/auth";
import { splitCosts, personalShare } from "@/lib/cost";
import { eq } from "drizzle-orm";
import { EpicerieTable } from "./epicerie-table";
import { AddGroceryForm } from "./add-grocery-form";
import { AddDrinkForm } from "@/app/boissons/add-drink-form";
import { isAtMealWithSlots, getMealKey } from "@/lib/meals";

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
  // Pack pricing
  packLabel: string | null;
  packSize: string | null;
  packPrice: string | null;
  packRoundUp: boolean;
  packsToBuy: number | null;  // computed
  effectiveCost: number;       // computed (manual cost OR from packs)
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
  const slots = await getMealSlots();
  const menuRows = await db.select().from(schema.menuItems)
    .where(eq(schema.menuItems.tripId, trip.id));

  const itemTotals = new Map<string, number>();
  const itemAvgPerPerson = new Map<string, { sum: number; count: number }>();

  for (const row of menuRows) {
    const mealKey = getMealKey(row.day, row.meal);
    const attendees = participants.filter((p) => isAtMealWithSlots(slots, p, mealKey)).length;
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
      qtyPerPersonDisplay = avg ? avg.sum : 0;
    } else if (g.source === "fixed" && g.fixedQtyPerPerson) {
      qtyPerPersonDisplay = Number(g.fixedQtyPerPerson);
      totalRaw = qtyPerPersonDisplay * confirmedCount;
    }
    const totalWithMargin = totalRaw * margin;
    const toBuy = Math.ceil(totalWithMargin);

    // Pack pricing computation
    let packsToBuy: number | null = null;
    let effectiveCost = Number(g.cost ?? 0);
    if (g.packPrice && g.packSize && Number(g.packSize) > 0) {
      const packsRaw = totalWithMargin / Number(g.packSize);
      packsToBuy = g.packRoundUp ? Math.ceil(packsRaw) : packsRaw;
      effectiveCost = packsToBuy * Number(g.packPrice);
    }

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
      packLabel: g.packLabel,
      packSize: g.packSize,
      packPrice: g.packPrice,
      packRoundUp: g.packRoundUp ?? true,
      packsToBuy,
      effectiveCost,
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
      packLabel: null,
      packSize: null,
      packPrice: null,
      packRoundUp: true,
      packsToBuy: null,
      effectiveCost: Number(d.cost ?? 0),
    });
  });

  const groceryTotalCost = rows.filter((r) => r.source !== "drink").reduce((s, r) => s + r.effectiveCost, 0);
  const drinksTotalCost = rows.filter((r) => r.source === "drink").reduce((s, r) => s + r.effectiveCost, 0);
  const totalCost = groceryTotalCost + drinksTotalCost;
  const split = splitCosts({
    participants,
    fixedCost: 0,
    groceryCost: groceryTotalCost,
    alcoholCost: drinksTotalCost,
  });
  const me = await getCurrentParticipant();
  const myShare = me ? personalShare(split, me.drinksAlcohol) : null;
  const allConfirmed = confirmedCount === totalParticipants;
  const someoneNoArrival = participants.some((p) => p.confirmed === "OUI" && (!p.arrivalMeal || !p.departureMeal));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🛒 Épicerie & Boissons</h1>
        <p className="text-muted text-sm">
          Bouffe calculée par <strong>présence à chaque repas</strong>. Boissons en pool. L'alcool est divisé entre les buveurs seulement.
        </p>
      </div>

      {someoneNoArrival && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
          ⚠ Certains confirmés n'ont pas encore choisi leur 🛬 premier et 🛫 dernier repas. Les quantités les considèrent comme présents partout (optimiste).
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Items" value={rows.length} accent="primary" />
        <Stat label="Bouffe" value={formatCurrency(groceryTotalCost)} accent="ok" hint={`÷ ${split.confirmedCount} pers`} />
        <Stat label="Alcool" value={formatCurrency(drinksTotalCost)} accent="ok" hint={`÷ ${split.alcoholDrinkersCount} buveurs`} />
        <Stat label="Total" value={formatCurrency(totalCost)} accent="primary" hint={!allConfirmed ? `${confirmedCount}/${totalParticipants} confirmés` : undefined} />
      </div>

      {myShare !== null && me && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="text-xs uppercase tracking-wide text-teal-700">Ta part, {me.name.split(" ")[0]}</div>
            <div className="text-xs text-muted">{me.drinksAlcohol ? "🍻 avec alcool" : "🚫🍺 sans alcool"}</div>
          </div>
          <span className="text-2xl font-bold tabular-nums text-teal-900">{formatCurrency(myShare)}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-muted">🍻 Coût avec alcool</div>
          <div className="font-semibold text-lg tabular-nums">{formatCurrency(split.perDrinker)}</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-muted">🚫🍺 Coût sans alcool</div>
          <div className="font-semibold text-lg tabular-nums">{formatCurrency(split.perNonDrinker)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <AddGroceryForm tripId={trip.id} />
        <AddDrinkForm tripId={trip.id} />
      </div>

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
