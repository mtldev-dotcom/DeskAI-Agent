/**
 * Clones L0 onboarding template into a given workspace's L1 layer.
 * Usage: WORKSPACE_ID=xxx pnpm db:seed-onboarding
 */
import "./load-env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { resources } from "../lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const workspaceId = process.env.WORKSPACE_ID;
if (!workspaceId) throw new Error("WORKSPACE_ID is not set");

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  return databaseUrl;
}

function requireWorkspaceId() {
  const id = process.env.WORKSPACE_ID;
  if (!id) throw new Error("WORKSPACE_ID is not set");
  return id;
}

async function main() {
const workspaceId = requireWorkspaceId();
const client = postgres(requireDatabaseUrl(), { max: 1 });
const db = drizzle(client);

const [template] = await db
  .select()
  .from(resources)
  .where(
    and(
      eq(resources.layer, "L0"),
      eq(resources.kind, "onboarding_template"),
      eq(resources.name, "default-onboarding")
    )
  )
  .limit(1);

if (!template) {
  console.error("L0 onboarding template not found. Run pnpm db:seed first.");
  process.exit(1);
}

const existing = await db
  .select({ id: resources.id })
  .from(resources)
  .where(
    and(
      eq(resources.workspaceId, workspaceId),
      eq(resources.kind, "desk"),
      eq(resources.name, "Welcome")
    )
  )
  .limit(1);

if (existing[0]) {
  console.log("Onboarding desk already exists for this workspace.");
} else {
  await db.insert(resources).values({
    id: randomUUID(),
    workspaceId,
    layer: "L1",
    kind: "desk",
    name: "Welcome",
    content: template.content,
    metadata: {},
  });
  console.log("Onboarding desk created.");
}

await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
