// Ordered list of meal slots for the trip. Used for arrival/departure selectors
// and for computing per-meal attendance.

export const MEAL_SLOTS = [
  { key: "Vendredi-Souper",   day: "Vendredi 12",  meal: "Souper",   label: "Ven 12 — Souper",   emoji: "🌙" },
  { key: "Vendredi-Snacks",   day: "Vendredi 12",  meal: "Snacks",   label: "Ven 12 — Snacks",   emoji: "🍻" },
  { key: "Samedi-Déjeuner",   day: "Samedi 13",    meal: "Déjeuner", label: "Sam 13 — Déjeuner", emoji: "🌅" },
  { key: "Samedi-Dîner",      day: "Samedi 13",    meal: "Dîner",    label: "Sam 13 — Dîner",    emoji: "🥪" },
  { key: "Samedi-Souper",     day: "Samedi 13",    meal: "Souper",   label: "Sam 13 — Souper",   emoji: "🥩" },
  { key: "Samedi-Snacks",     day: "Samedi 13",    meal: "Snacks",   label: "Sam 13 — Snacks",   emoji: "🍻" },
  { key: "Dimanche-Déjeuner", day: "Dimanche 14",  meal: "Déjeuner", label: "Dim 14 — Déjeuner", emoji: "🌅" },
  { key: "Dimanche-Dîner",    day: "Dimanche 14",  meal: "Dîner",    label: "Dim 14 — Dîner",    emoji: "🥪" },
  { key: "Dimanche-Souper",   day: "Dimanche 14",  meal: "Souper",   label: "Dim 14 — Souper",   emoji: "🥩" },
  { key: "Dimanche-Snacks",   day: "Dimanche 14",  meal: "Snacks",   label: "Dim 14 — Snacks",   emoji: "🍻" },
  { key: "Lundi-Déjeuner",    day: "Lundi 15",     meal: "Déjeuner", label: "Lun 15 — Déjeuner", emoji: "🌅" },
  { key: "Lundi-Dîner",       day: "Lundi 15",     meal: "Dîner",    label: "Lun 15 — Dîner (sur la route)", emoji: "🚗" },
] as const;

export type MealKey = (typeof MEAL_SLOTS)[number]["key"];

export function mealIndex(key: string | null | undefined): number {
  if (!key) return -1;
  return MEAL_SLOTS.findIndex((s) => s.key === key);
}

export function getMealKey(day: string, meal: string): string {
  return `${day.split(" ")[0]}-${meal}`;
}

/** Returns true if participant is at this meal based on their arrival/departure. */
export function isAtMeal(
  participant: { arrivalMeal: string | null; departureMeal: string | null; confirmed: string },
  mealKey: string,
): boolean {
  if (participant.confirmed !== "OUI") return false;
  const mIdx = mealIndex(mealKey);
  if (mIdx < 0) return false;
  const aIdx = mealIndex(participant.arrivalMeal);
  const dIdx = mealIndex(participant.departureMeal);
  // If not set, assume they're at every meal (default optimistic)
  if (aIdx < 0 || dIdx < 0) return true;
  return mIdx >= aIdx && mIdx <= dIdx;
}
