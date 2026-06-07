import type { Participant } from "@/db/schema";

export type CostSplit = {
  total: number;
  fixedCost: number;
  groceryCost: number;
  alcoholCost: number;
  confirmedCount: number;
  alcoholDrinkersCount: number;
  sharedPerPerson: number;
  alcoholPerDrinker: number;
  perDrinker: number;
  perNonDrinker: number;
};

export function splitCosts({
  participants,
  fixedCost,
  groceryCost,
  alcoholCost,
}: {
  participants: Participant[];
  fixedCost: number;
  groceryCost: number;
  alcoholCost: number;
}): CostSplit {
  const confirmed = participants.filter((p) => p.confirmed === "OUI");
  const confirmedCount = confirmed.length;
  const alcoholDrinkersCount = confirmed.filter((p) => p.drinksAlcohol).length;

  const sharedPerPerson = confirmedCount > 0 ? (fixedCost + groceryCost) / confirmedCount : 0;
  const alcoholPerDrinker = alcoholDrinkersCount > 0 ? alcoholCost / alcoholDrinkersCount : 0;

  return {
    total: fixedCost + groceryCost + alcoholCost,
    fixedCost,
    groceryCost,
    alcoholCost,
    confirmedCount,
    alcoholDrinkersCount,
    sharedPerPerson,
    alcoholPerDrinker,
    perDrinker: sharedPerPerson + alcoholPerDrinker,
    perNonDrinker: sharedPerPerson,
  };
}

export function personalShare(split: CostSplit, drinksAlcohol: boolean): number {
  return drinksAlcohol ? split.perDrinker : split.perNonDrinker;
}
