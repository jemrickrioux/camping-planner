import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { StockCommunTable } from "./stock-commun-table";

export const dynamic = "force-dynamic";

export default async function StockCommunPage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const items = await db
    .select()
    .from(schema.communStockItems)
    .where(eq(schema.communStockItems.tripId, trip.id))
    .orderBy(schema.communStockItems.position);

  const totalItems = items.length;
  const withOwner = items.filter((i) => i.ownerId !== null || i.isGroup).length;
  const confirmed = items.filter((i) => i.confirmed).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">📦 Stock commun</h1>
        <p className="text-muted text-sm">Chaque item doit avoir un owner. Quand l'owner confirme avoir l'item, on coche.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total" value={totalItems} accent="primary" />
        <Stat label="Avec owner" value={`${withOwner}/${totalItems}`} accent={withOwner === totalItems ? "ok" : "warn"} />
        <Stat label="Confirmés" value={`${confirmed}/${totalItems}`} accent={confirmed === totalItems ? "ok" : "warn"} />
      </div>

      <StockCommunTable items={items} participants={participants} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent: "primary" | "ok" | "warn" }) {
  const cls = {
    primary: "bg-teal-50 text-teal-900 border-teal-200",
    ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
