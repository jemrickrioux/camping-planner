import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { cache } from "react";

const TRIP_SLUG = process.env.TRIP_SLUG || "poisson-blanc-2026";

export const getCurrentTrip = cache(async () => {
  const trips = await db
    .select()
    .from(schema.trips)
    .where(eq(schema.trips.slug, TRIP_SLUG))
    .limit(1);
  if (trips.length === 0) {
    throw new Error(`Trip with slug ${TRIP_SLUG} not found`);
  }
  return trips[0];
});

export const getParticipants = cache(async () => {
  const trip = await getCurrentTrip();
  return db
    .select()
    .from(schema.participants)
    .where(eq(schema.participants.tripId, trip.id))
    .orderBy(schema.participants.position);
});

export const getConfirmedCount = cache(async () => {
  const participants = await getParticipants();
  return participants.filter((p) => p.confirmed === "OUI").length;
});
