import { db, schema } from "@/lib/db";
import { getCurrentTrip } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { MenuByDay } from "./menu-by-day";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const trip = await getCurrentTrip();
  const items = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.tripId, trip.id))
    .orderBy(schema.menuItems.position);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🍽️ Menu</h1>
        <p className="text-muted text-sm">
          Source de vérité de l'épicerie. Modifier une qté/pers ici → l'épicerie se recalcule automatiquement.
        </p>
      </div>
      <MenuByDay items={items} tripId={trip.id} />
    </div>
  );
}
