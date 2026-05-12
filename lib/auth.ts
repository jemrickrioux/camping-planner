import { cookies } from "next/headers";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

const PARTICIPANT_COOKIE = "camping-participant-id";
const ORGANIZER_COOKIE = "camping-organizer";

function getOrganizerPin(): string | undefined {
  type NetlifyGlobal = { env?: { get?: (k: string) => string | undefined } };
  const netlifyEnv = (globalThis as unknown as { Netlify?: NetlifyGlobal }).Netlify?.env;
  return netlifyEnv?.get?.("ORGANIZER_PIN") ?? process.env.ORGANIZER_PIN;
}

export async function getCurrentParticipantId(): Promise<number | null> {
  const c = await cookies();
  const v = c.get(PARTICIPANT_COOKIE)?.value;
  if (!v) return null;
  const id = parseInt(v, 10);
  return Number.isFinite(id) ? id : null;
}

export async function getCurrentParticipant() {
  const id = await getCurrentParticipantId();
  if (!id) return null;
  const [p] = await db.select().from(schema.participants).where(eq(schema.participants.id, id)).limit(1);
  return p ?? null;
}

export async function isOrganizerSession(): Promise<boolean> {
  const pin = getOrganizerPin();
  if (!pin) return false;
  const c = await cookies();
  const token = c.get(ORGANIZER_COOKIE)?.value;
  return !!token && token === pin;
}

export async function canManageGrocery(): Promise<boolean> {
  if (await isOrganizerSession()) return true;
  const p = await getCurrentParticipant();
  return !!p?.canManageGrocery;
}

export async function assertOrganizer() {
  if (!(await isOrganizerSession())) {
    throw new Error("Réservé à l'organisateur.");
  }
}

export async function assertCanManageGrocery() {
  if (!(await canManageGrocery())) {
    throw new Error("Réservé à l'équipe épicerie.");
  }
}

export async function assertSelfOrOrganizer(participantId: number) {
  if (await isOrganizerSession()) return;
  const me = await getCurrentParticipantId();
  if (me === participantId) return;
  throw new Error("Tu peux seulement modifier ton propre profil.");
}

export const COOKIE_NAMES = {
  participant: PARTICIPANT_COOKIE,
  organizer: ORGANIZER_COOKIE,
} as const;

export function verifyPin(pin: string): boolean {
  const expected = getOrganizerPin();
  return !!expected && pin === expected;
}
