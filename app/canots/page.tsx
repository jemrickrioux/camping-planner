import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { CanoesView } from "./canoes-view";

export const dynamic = "force-dynamic";

export default async function CanotsPage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const canoes = await db.select().from(schema.canoes)
    .where(eq(schema.canoes.tripId, trip.id))
    .orderBy(schema.canoes.position);
  const paddlers = await db.select().from(schema.canoePaddlers);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🛶 Canots — location</h1>
        <p className="text-muted text-sm">
          Réserver et assigner les places. Le coût total se calcule au fur et à mesure des choix.
        </p>
      </div>
      <CanoesView
        tripId={trip.id}
        canoes={canoes}
        paddlers={paddlers}
        participants={participants}
      />
    </div>
  );
}
