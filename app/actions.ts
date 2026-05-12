"use server";

import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Trip details (organizer only) ────────────────────────────────────────
export async function updateTrip(id: number, data: Partial<{
  destination: string;
  site: string;
  reservationNo: string;
  startDate: string;
  endDate: string;
  arrivalTime: string;
  departureTime: string;
  siteCost: string;
  rentalCost: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  notes: string;
}>) {
  await db.update(schema.trips).set(data).where(eq(schema.trips.id, id));
  revalidatePath("/");
}

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
  packLabel?: string | null;
  packSize?: string | null;
  packPrice?: string | null;
  packRoundUp?: boolean;
}) {
  await db.update(schema.groceryItems).set(data).where(eq(schema.groceryItems.id, id));
  revalidatePath("/epicerie");
  revalidatePath("/");
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

// ── ADD operations (organizer typically) ────────────────────────────────
async function getNextPosition(
  tableName: "perso_stock_items" | "commun_stock_items" | "menu_items" | "grocery_items" | "drinks" | "todos" | "participants",
  tripId: number,
): Promise<number> {
  const result = await db.execute(
    sql`SELECT COALESCE(MAX(position), 0) + 1 AS next FROM ${sql.raw(tableName)} WHERE trip_id = ${tripId}`,
  );
  type Row = { next: number | string };
  const rows = (result as unknown as { rows?: Row[] } & Row[]).rows ?? (result as unknown as Row[]);
  return Number(rows?.[0]?.next ?? 1);
}

export async function addPersoStockItem(tripId: number, name: string, notes?: string) {
  const position = await getNextPosition("perso_stock_items", tripId);
  await db.insert(schema.persoStockItems).values({ tripId, position, name, notes: notes || null });
  revalidatePath("/stock-perso");
}

export async function deletePersoStockItem(id: number) {
  await db.delete(schema.persoStockItems).where(eq(schema.persoStockItems.id, id));
  revalidatePath("/stock-perso");
}

export async function addCommunStockItem(tripId: number, data: { name: string; quantity?: number; notes?: string }) {
  const position = await getNextPosition("commun_stock_items", tripId);
  await db.insert(schema.communStockItems).values({
    tripId, position,
    name: data.name,
    quantity: data.quantity ?? 1,
    notes: data.notes || null,
  });
  revalidatePath("/stock-commun");
  revalidatePath("/");
}

export async function deleteCommunStockItem(id: number) {
  await db.delete(schema.communStockItems).where(eq(schema.communStockItems.id, id));
  revalidatePath("/stock-commun");
}

export async function addMenuItem(tripId: number, data: {
  day: string; meal: string; section: string; item: string; unit: string; qtyPerPerson: string; notes?: string;
}) {
  const position = await getNextPosition("menu_items", tripId);
  await db.insert(schema.menuItems).values({
    tripId, position,
    day: data.day, meal: data.meal, section: data.section, item: data.item, unit: data.unit,
    qtyPerPerson: data.qtyPerPerson, notes: data.notes || null,
  });
  revalidatePath("/menu");
  revalidatePath("/epicerie");
}

export async function addGroceryItem(tripId: number, data: {
  section: string; name: string; unit?: string;
  source: "menu" | "fixed" | "note";
  matchItem?: string; fixedQtyPerPerson?: string; fixedText?: string;
}) {
  const position = await getNextPosition("grocery_items", tripId);
  await db.insert(schema.groceryItems).values({
    tripId, position,
    section: data.section, name: data.name, unit: data.unit || null,
    source: data.source,
    matchItem: data.matchItem || null,
    fixedQtyPerPerson: data.fixedQtyPerPerson || null,
    fixedText: data.fixedText || null,
  });
  revalidatePath("/epicerie");
}

export async function deleteGroceryItem(id: number) {
  await db.delete(schema.groceryItems).where(eq(schema.groceryItems.id, id));
  revalidatePath("/epicerie");
}

export async function addDrink(tripId: number, data: {
  category: string; item: string; format?: string; quantity?: number; notes?: string;
}) {
  const position = await getNextPosition("drinks", tripId);
  await db.insert(schema.drinks).values({
    tripId, position,
    category: data.category, item: data.item,
    format: data.format || null,
    quantity: data.quantity ?? 1,
    notes: data.notes || null,
  });
  revalidatePath("/boissons");
  revalidatePath("/epicerie");
}

export async function deleteDrink(id: number) {
  await db.delete(schema.drinks).where(eq(schema.drinks.id, id));
  revalidatePath("/boissons");
  revalidatePath("/epicerie");
}

export async function addTodo(tripId: number, data: {
  action: string; responsible?: string; deadline?: string; notes?: string;
}) {
  const position = await getNextPosition("todos", tripId);
  await db.insert(schema.todos).values({
    tripId, position,
    action: data.action,
    responsible: data.responsible || null,
    deadline: data.deadline || null,
    notes: data.notes || null,
  });
  revalidatePath("/plan-action");
  revalidatePath("/");
}

export async function deleteTodo(id: number) {
  await db.delete(schema.todos).where(eq(schema.todos.id, id));
  revalidatePath("/plan-action");
}

export async function addParticipant(tripId: number, name: string) {
  const position = await getNextPosition("participants", tripId);
  await db.insert(schema.participants).values({
    tripId, position, name,
    confirmed: "?",
    role: "participant",
  });
  revalidatePath("/participants");
  revalidatePath("/");
}

export async function deleteParticipant(id: number) {
  await db.delete(schema.participants).where(eq(schema.participants.id, id));
  revalidatePath("/participants");
  revalidatePath("/");
}

// ── Canoes ───────────────────────────────────────────────────────────────
export async function addCanoe(tripId: number, data: {
  type: string; capacity: number; dailyRate: string; days?: number; notes?: string;
}) {
  const position = await getNextPosition("commun_stock_items", tripId); // re-use pattern; canoes table not in enum
  // re-query for canoes
  const r = await db.execute(sql`SELECT COALESCE(MAX(position), 0) + 1 AS next FROM canoes WHERE trip_id = ${tripId}`);
  type Row = { next: number | string };
  const rows = (r as unknown as { rows?: Row[] } & Row[]).rows ?? (r as unknown as Row[]);
  const canoePosition = Number(rows?.[0]?.next ?? position);
  await db.insert(schema.canoes).values({
    tripId, position: canoePosition,
    type: data.type, capacity: data.capacity, dailyRate: data.dailyRate,
    days: data.days ?? 4, notes: data.notes || null,
  });
  revalidatePath("/canots");
  revalidatePath("/");
}

export async function updateCanoe(id: number, data: Partial<{
  type: string; capacity: number; dailyRate: string; days: number; notes: string;
}>) {
  await db.update(schema.canoes).set(data).where(eq(schema.canoes.id, id));
  revalidatePath("/canots");
  revalidatePath("/");
}

export async function deleteCanoe(id: number) {
  await db.delete(schema.canoes).where(eq(schema.canoes.id, id));
  revalidatePath("/canots");
  revalidatePath("/");
}

export async function assignPaddler(canoeId: number, participantId: number, direction: "outbound" | "return" = "outbound") {
  await db
    .insert(schema.canoePaddlers)
    .values({ canoeId, participantId, direction })
    .onConflictDoNothing();
  revalidatePath("/canots");
}

export async function unassignPaddler(canoeId: number, participantId: number, direction: "outbound" | "return" = "outbound") {
  await db
    .delete(schema.canoePaddlers)
    .where(and(
      eq(schema.canoePaddlers.canoeId, canoeId),
      eq(schema.canoePaddlers.participantId, participantId),
      eq(schema.canoePaddlers.direction, direction),
    ));
  revalidatePath("/canots");
}

export async function copyOutboundToReturn(canoeId: number) {
  // Copy all outbound paddlers to return for this canoe
  const outboundPaddlers = await db
    .select()
    .from(schema.canoePaddlers)
    .where(and(eq(schema.canoePaddlers.canoeId, canoeId), eq(schema.canoePaddlers.direction, "outbound")));
  for (const p of outboundPaddlers) {
    await db
      .insert(schema.canoePaddlers)
      .values({ canoeId, participantId: p.participantId, direction: "return" })
      .onConflictDoNothing();
  }
  revalidatePath("/canots");
}


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
