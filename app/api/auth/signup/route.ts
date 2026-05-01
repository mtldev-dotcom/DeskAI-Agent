import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { provisionWorkspaceForUser } from "@/lib/auth/provision";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; workspaceName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const workspaceName = body.workspaceName?.trim() || "My Workspace";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const [user] = await db
    .insert(users)
    .values({
      id: generateId(),
      email,
      passwordHash: await hash(password, 12),
    })
    .returning();

  const { workspace } = await provisionWorkspaceForUser(user, workspaceName);

  return NextResponse.json(
    {
      user: { id: user.id, email: user.email },
      workspace,
    },
    { status: 201 }
  );
}
