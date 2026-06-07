import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  date,
  time,
  numeric,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  destination: text("destination"),
  site: text("site"),
  reservationNo: text("reservation_no"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  arrivalTime: time("arrival_time"),
  departureTime: time("departure_time"),
  siteCost: numeric("site_cost", { precision: 10, scale: 2 }),
  rentalCost: numeric("rental_cost", { precision: 10, scale: 2 }),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  contactAddress: text("contact_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("participant"), // "organizer" | "participant"
  confirmed: text("confirmed").notNull().default("?"),
  allergies: text("allergies"),
  notes: text("notes"),
  // Arrival/Departure (which meal you join/leave at)
  arrivalMeal: text("arrival_meal"),  // e.g. "Vendredi-Souper"
  departureMeal: text("departure_meal"), // e.g. "Lundi-Dîner"
  // Lift outbound (going TO camp)
  liftRole: text("lift_role"),
  liftSeats: integer("lift_seats"),
  liftFrom: text("lift_from"),
  liftTime: text("lift_time"),
  liftDriverId: integer("lift_driver_id"),
  // Lift return (going home)
  liftReturnRole: text("lift_return_role"),
  liftReturnSeats: integer("lift_return_seats"),
  liftReturnFrom: text("lift_return_from"),
  liftReturnTime: text("lift_return_time"),
  liftReturnDriverId: integer("lift_return_driver_id"),
  canManageGrocery: boolean("can_manage_grocery").notNull().default(false),
  drinksAlcohol: boolean("drinks_alcohol").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const persoStockItems = pgTable("perso_stock_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  notes: text("notes"),
});

export const persoStockChecks = pgTable("perso_stock_checks", {
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  persoStockItemId: integer("perso_stock_item_id").notNull().references(() => persoStockItems.id, { onDelete: "cascade" }),
  hasIt: boolean("has_it").notNull().default(false),
  status: text("status").notNull().default("to_buy"), // 'to_buy' | 'owned' | 'packed' | 'ignored'
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.participantId, table.persoStockItemId] }),
}));

export const PERSO_STATUSES = ["to_buy", "owned", "packed", "ignored"] as const;
export type PersoStatus = (typeof PERSO_STATUSES)[number];

export const communStockItems = pgTable("commun_stock_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity"),
  ownerId: integer("owner_id").references(() => participants.id, { onDelete: "set null" }),
  isGroup: boolean("is_group").default(false),
  confirmed: boolean("confirmed").default(false),
  notes: text("notes"),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  day: text("day").notNull(),
  meal: text("meal").notNull(),
  section: text("section").notNull(),
  item: text("item").notNull(),
  unit: text("unit").notNull(),
  qtyPerPerson: numeric("qty_per_person", { precision: 10, scale: 3 }).notNull(),
  notes: text("notes"),
});

export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  section: text("section").notNull(),
  name: text("name").notNull(),
  unit: text("unit"),
  source: text("source").notNull(),
  matchItem: text("match_item"),
  fixedQtyPerPerson: numeric("fixed_qty_per_person", { precision: 10, scale: 3 }),
  fixedText: text("fixed_text"),
  margin: numeric("margin", { precision: 4, scale: 3 }).default("1.15"),
  buyerId: integer("buyer_id").references(() => participants.id, { onDelete: "set null" }),
  cost: numeric("cost", { precision: 10, scale: 2 }),  // manual lump-sum cost (deprecated when pack fields set)
  // Pack pricing: total = packs * pack_price, where packs = needed/pack_size (round up if pack_round_up)
  packLabel: text("pack_label"),                          // "kg", "douzaine", "lb", "L", "paquet 24"
  packSize: numeric("pack_size", { precision: 10, scale: 3 }),  // how many menu-units per pack (1000 for kg→g)
  packPrice: numeric("pack_price", { precision: 10, scale: 2 }), // price for one pack
  packRoundUp: boolean("pack_round_up").default(true),    // round up to whole packs (eggs, paquets); false for kg/L
  confirmed: boolean("confirmed").default(false),
  notes: text("notes"),
});

export const drinks = pgTable("drinks", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  category: text("category").notNull(),
  item: text("item").notNull(),
  format: text("format"),
  quantity: integer("quantity"),
  ownerId: integer("owner_id").references(() => participants.id, { onDelete: "set null" }),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  confirmed: boolean("confirmed").default(false),
  notes: text("notes"),
});

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  action: text("action").notNull(),
  responsible: text("responsible"),
  deadline: text("deadline"),
  status: text("status").notNull().default("À faire"),
  notes: text("notes"),
});

export const canoes = pgTable("canoes", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull(),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }).notNull(),
  days: integer("days").notNull().default(4),
  notes: text("notes"),
});

export const canoePaddlers = pgTable("canoe_paddlers", {
  canoeId: integer("canoe_id").notNull().references(() => canoes.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  direction: text("direction").notNull().default("outbound"), // 'outbound' | 'return'
}, (table) => ({
  pk: primaryKey({ columns: [table.canoeId, table.participantId, table.direction] }),
}));

export type Canoe = typeof canoes.$inferSelect;
export type CanoePaddler = typeof canoePaddlers.$inferSelect;

export type Participant = typeof participants.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type GroceryItem = typeof groceryItems.$inferSelect;
export type Drink = typeof drinks.$inferSelect;
export type CommunStockItem = typeof communStockItems.$inferSelect;
export type PersoStockItem = typeof persoStockItems.$inferSelect;
export type Todo = typeof todos.$inferSelect;
