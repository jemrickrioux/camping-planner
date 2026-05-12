"use server";

import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Participants ─────────────────────────────────────────────────────────
export async function updateParticipant(id: number, data: {
  confirmed?: string;
  email?: string;
  phone?: string;
  allergies?: string;
  notes?: string;
}) {
  await db.update(schema.participants).set(data).where(eq(schema.participants.id, id));
  revalidatePath("/");
  revalidatePath("/participants");
}

// ── Lifts (carpooling) ───────────────────────────────────────────────────
export async function updateLift(id: number, data: {
  liftRole?: string | null;
  liftSeats?: number | null;
  liftFrom?: string | null;
  liftTime?: string | null;
  liftDriverId?: number | null;
  liftReturnRole?: string | null;
  liftReturnSeats?: number | null;
  liftReturnFrom?: string | null;
  liftReturnTime?: string | null;
  liftReturnDriverId?: number | null;
}) {
  await db.update(schema.participants).set(data).where(eq(schema.participants.id, id));
  revalidatePath("/lifts");
  revalidatePath("/");
}

// ── Arrival / Departure per meal ─────────────────────────────────────────
export async function updateArrivalDeparture(id: number, data: {
  arrivalMeal?: string | null;
  departureMeal?: string | null;
}) {
  await db.update(schema.participants).set(data).where(eq(schema.participants.id, id));
  revalidatePath("/participants");
  revalidatePath("/");
}

// ── Stock perso ──────────────────────────────────────────────────────────
export async function togglePersoStockCheck(participantId: number, persoStockItemId: number, hasIt: boolean) {
  await db
    .insert(schema.persoStockChecks)
    .values({ participantId, persoStockItemId, hasIt })
    .onConflictDoUpdate({
      target: [schema.persoStockChecks.participantId, schema.persoStockChecks.persoStockItemId],
      set: { hasIt, updatedAt: new Date() },
    });
  revalidatePath("/stock-perso");
}

// ── Stock commun ─────────────────────────────────────────────────────────
export async function updateCommunStock(id: number, data: {
  ownerId?: number | null;
  isGroup?: boolean;
  confirmed?: boolean;
  quantity?: number;
  notes?: string;
}) {
  await db.update(schema.communStockItems).set(data).where(eq(schema.communStockItems.id, id));
  revalidatePath("/stock-commun");
}

// ── Menu ─────────────────────────────────────────────────────────────────
export async function updateMenuItem(id: number, data: {
  qtyPerPerson?: string;
  notes?: string;
}) {
  await db.update(schema.menuItems).set(data).where(eq(schema.menuItems.id, id));
  revalidatePath("/menu");
  revalidatePath("/epicerie");
}

export async function deleteMenuItem(id: number) {
  await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
  revalidatePath("/menu");
  revalidatePath("/epicerie");
}

// ── Epicerie ─────────────────────────────────────────────────────────────
export async function updateGroceryItem(id: number, data: {
  buyerId?: number | null;
  cost?: string | null;
  confirmed?: boolean;
  notes?: string;
}) {
  await db.update(schema.groceryItems).set(data).where(eq(schema.groceryItems.id, id));
  revalidatePath("/epicerie");
}

export async function bulkAssignGrocerySection(
  tripId: number,
  section: string,
  buyerId: number | null,
) {
  await db
    .update(schema.groceryItems)
    .set({ buyerId })
    .where(and(eq(schema.groceryItems.tripId, tripId), eq(schema.groceryItems.section, section)));
  revalidatePath("/epicerie");
  revalidatePath("/");
}

// ── Menu (organizer can bulk-update qty across all rows with same item) ──
export async function updateMenuItemsByItem(
  tripId: number,
  item: string,
  qtyPerPerson: string,
) {
  await db
    .update(schema.menuItems)
    .set({ qtyPerPerson })
    .where(and(eq(schema.menuItems.tripId, tripId), eq(schema.menuItems.item, item)));
  revalidatePath("/menu");
  revalidatePath("/epicerie");
}

export async function updateMenuItemsByItemMeal(
  tripId: number,
  item: string,
  meal: string,
  qtyPerPerson: string,
) {
  await db
    .update(schema.menuItems)
    .set({ qtyPerPerson })
    .where(
      and(
        eq(schema.menuItems.tripId, tripId),
        eq(schema.menuItems.item, item),
        eq(schema.menuItems.meal, meal),
      ),
    );
  revalidatePath("/menu");
  revalidatePath("/epicerie");
}

// Silence unused import warning for sql
void sql;

// ── Drinks ───────────────────────────────────────────────────────────────
export async function updateDrink(id: number, data: {
  quantity?: number;
  ownerId?: number | null;
  cost?: string | null;
  confirmed?: boolean;
  notes?: string;
}) {
  await db.update(schema.drinks).set(data).where(eq(schema.drinks.id, id));
  revalidatePath("/boissons");
  revalidatePath("/epicerie");
}

// ── Todos ────────────────────────────────────────────────────────────────
export async function updateTodo(id: number, data: {
  status?: string;
  responsible?: string;
  notes?: string;
}) {
  await db.update(schema.todos).set(data).where(eq(schema.todos.id, id));
  revalidatePath("/plan-action");
}
