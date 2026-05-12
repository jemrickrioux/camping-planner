import { db, schema } from "@/lib/db";
import { getCurrentTrip, getParticipants, getMealSlots } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { MenuByDay } from "./menu-by-day";
import { AddMenuForm } from "./add-menu-form";
import { isAtMealWithSlots } from "@/lib/meals";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const items = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.tripId, trip.id))
    .orderBy(schema.menuItems.position);

  const slots = await getMealSlots();
  const attendance = slots.map((slot) => ({
    slot,
    count: participants.filter((p) => isAtMealWithSlots(slots, p, slot.key)).length,
    confirmedTotal: participants.filter((p) => p.confirmed === "OUI").length,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🍽️ Menu</h1>
        <p className="text-muted text-sm">
          Source de vérité de l'épicerie. Modifier une qté/pers ici → l'épicerie se recalcule automatiquement.
        </p>
      </div>

      <details className="bg-card border border-border rounded-2xl overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer font-semibold flex items-center justify-between gap-2">
          <span>👥 Présences attendues par repas</span>
          <span className="text-xs text-muted font-normal">basé sur arrivées/départs</span>
        </summary>
        <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {attendance.map(({ slot, count, confirmedTotal }) => (
            <div key={slot.key} className="bg-slate-50 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <span className="text-lg">{slot.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{slot.label}</div>
                <div className="text-xs text-muted tabular-nums">
                  {count}/{confirmedTotal} confirmés
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>

      <AddMenuForm tripId={trip.id} />

      <MenuByDay items={items} tripId={trip.id} />
    </div>
  );
}
