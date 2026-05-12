import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants, getConfirmedCount } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { BoissonsTable } from "./boissons-table";

export const dynamic = "force-dynamic";

export default async function BoissonsPage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const confirmedCount = await getConfirmedCount();
  const drinks = await db
    .select()
    .from(schema.drinks)
    .where(eq(schema.drinks.tripId, trip.id))
    .orderBy(schema.drinks.position);

  const totalCost = drinks.reduce((sum, d) => sum + Number(d.cost ?? 0), 0);
  const costPerPax = confirmedCount > 0 ? totalCost / confirmedCount : 0;
  const totalBeers = drinks.filter(d => d.category === "Bières").reduce((sum, d) => sum + (d.quantity ?? 0) * 24, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🍻 Boissons (pool commun)</h1>
        <p className="text-muted text-sm">
          Tout est acheté en gang et divisé entre les {confirmedCount} confirmés. Pour bières spéciales/IPA, chacun apporte sa caisse en plus.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Bières prévues" value={totalBeers} accent="primary" hint={`= ${Math.round(totalBeers / Math.max(confirmedCount, 1))}/pax`} />
        <Stat label="Items dans pool" value={drinks.length} accent="primary" />
        <Stat label="Total estimé" value={formatCurrency(totalCost)} accent="ok" />
        <Stat label="Pool / pax" value={formatCurrency(costPerPax)} accent="ok" />
      </div>

      <BoissonsTable drinks={drinks} participants={participants} />
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
