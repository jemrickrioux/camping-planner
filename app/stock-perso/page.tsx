import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { StockPersoMatrix } from "./stock-perso-matrix";
import { AddPersoForm } from "./add-perso-form";

export const dynamic = "force-dynamic";

export default async function StockPersoPage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const items = await db.select().from(schema.persoStockItems).where(eq(schema.persoStockItems.tripId, trip.id)).orderBy(schema.persoStockItems.position);
  const checks = await db.select().from(schema.persoStockChecks);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🎒 Stock perso</h1>
        <p className="text-muted text-sm">Chacun coche ce qu'il amène. Ligne verte = tout le monde a coché.</p>
      </div>
      <AddPersoForm tripId={trip.id} />

      <StockPersoMatrix items={items} participants={participants} checks={checks} />
    </div>
  );
}
