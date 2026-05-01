import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var _pgClient: ReturnType<typeof postgres> | undefined;
  var _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getDb() {
  if (globalThis._db) return globalThis._db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = globalThis._pgClient ?? postgres(url, { max: 10 });
  if (process.env.NODE_ENV !== "production") globalThis._pgClient = client;

  const instance = drizzle(client, { schema });
  if (process.env.NODE_ENV !== "production") globalThis._db = instance;
  return instance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export type Db = ReturnType<typeof drizzle<typeof schema>>;
