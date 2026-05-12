"use server";

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
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
}) {
  await db.update(schema.participants).set(data).where(eq(schema.participants.id, id));
  revalidatePath("/lifts");
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
