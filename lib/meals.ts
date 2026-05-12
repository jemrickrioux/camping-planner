// Meal slots are *dynamic*: derived from the actual menu_items in DB.
// This means removing all items from a meal in the Menu also removes
// it from the arrival/departure pickers, attendance panels, etc.

const DAY_ORDER = ["Vendredi 12", "Samedi 13", "Dimanche 14", "Lundi 15"];
const MEAL_ORDER = ["Déjeuner", "Dîner", "Souper", "Snacks"];

const MEAL_EMOJI: Record<string, string> = {
  Déjeuner: "🌅",
  Dîner: "🥪",
  Souper: "🥩",
  Snacks: "🍻",
};

export type MealSlot = {
  key: string;       // canonical key, e.g. "Vendredi-Souper"
  day: string;       // full day label, e.g. "Vendredi 12"
  meal: string;      // meal type, e.g. "Souper"
  label: string;     // short display, e.g. "Ven 12 — Souper"
  emoji: string;
};

function shortDay(day: string): string {
  // "Vendredi 12" → "Ven 12"
  const [name, num] = day.split(" ");
  return `${name.slice(0, 3)}${num ? ` ${num}` : ""}`;
}

function makeSlot(day: string, meal: string): MealSlot {
  return {
    key: `${day.split(" ")[0]}-${meal}`,
    day,
    meal,
    label: `${shortDay(day)} — ${meal}`,
    emoji: MEAL_EMOJI[meal] ?? "🍽️",
  };
}

/** Build the ordered list of meal slots that actually have at least one item in the menu. */
export function buildMealSlots(menuItems: { day: string; meal: string }[]): MealSlot[] {
  const exists = new Set(menuItems.map((i) => `${i.day}::${i.meal}`));
  const slots: MealSlot[] = [];
  for (const day of DAY_ORDER) {
    for (const meal of MEAL_ORDER) {
      if (exists.has(`${day}::${meal}`)) slots.push(makeSlot(day, meal));
    }
  }
  return slots;
}

export function mealIndexIn(slots: MealSlot[], key: string | null | undefined): number {
  if (!key) return -1;
  return slots.findIndex((s) => s.key === key);
}

export function getMealKey(day: string, meal: string): string {
  return `${day.split(" ")[0]}-${meal}`;
}

/** True if participant is at this meal (based on arrival/departure window) */
export function isAtMealWithSlots(
  slots: MealSlot[],
  participant: { arrivalMeal: string | null; departureMeal: string | null; confirmed: string },
  mealKey: string,
): boolean {
  if (participant.confirmed !== "OUI") return false;
  const mIdx = mealIndexIn(slots, mealKey);
  if (mIdx < 0) return false;
  const aIdx = mealIndexIn(slots, participant.arrivalMeal);
  const dIdx = mealIndexIn(slots, participant.departureMeal);
  // If unset, assume present at all meals (optimistic)
  if (aIdx < 0 || dIdx < 0) return true;
  return mIdx >= aIdx && mIdx <= dIdx;
}
