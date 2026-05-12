// Catalogue de location du Parc régional du Poisson Blanc
// Source: https://poissonblanc.ca/informations/location-dembarcations/

export const CANOE_CATALOG = [
  { type: "Canot prospecteur 16' — 2 bancs",           capacity: 2, dailyRate: "43.00" },
  { type: "Canot prospecteur 16' Abitibi & Co",         capacity: 2, dailyRate: "51.00" },
  { type: "Canot prospecteur 17' — 3 bancs",            capacity: 3, dailyRate: "51.00" },
  { type: "Canot miramichi 20' — 4 bancs",              capacity: 4, dailyRate: "61.00" },
  { type: "Surf à pagaie — adulte",                     capacity: 1, dailyRate: "33.00" },
  { type: "Surf à pagaie — Touring",                    capacity: 1, dailyRate: "38.00" },
  { type: "Surf à pagaie — enfant",                     capacity: 1, dailyRate: "22.00" },
  { type: "Kayak de mer solo Epsilon 200",              capacity: 1, dailyRate: "38.00" },
] as const;

export type CanoeCatalogEntry = (typeof CANOE_CATALOG)[number];
