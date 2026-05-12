import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDatabaseUrl(): string {
  // Netlify Functions runtime exposes secret env vars via Netlify.env.get
  // (regular process.env doesn't include secret vars on Netlify)
  type NetlifyGlobal = { env?: { get?: (k: string) => string | undefined } };
  const netlifyEnv = (globalThis as unknown as { Netlify?: NetlifyGlobal }).Netlify?.env;
  const fromNetlify = netlifyEnv?.get?.("DATABASE_URL");
  if (fromNetlify) return fromNetlify;
  // Fallback for local dev and non-Netlify hosts
  const fromProcess = process.env.DATABASE_URL;
  if (fromProcess) return fromProcess;
  throw new Error("DATABASE_URL is not set (checked Netlify.env and process.env)");
}

function getDb() {
  if (_db) return _db;
  const sql = neon(getDatabaseUrl());
  _db = drizzle(sql, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_t, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export { schema };
