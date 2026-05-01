import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  bigint,
  integer,
  jsonb,
  primaryKey,
  index,
  unique,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ─── Enums ─────────────────────────────────────────────────────────────────

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
]);

export const layerEnum = pgEnum("layer", ["L0", "L1", "L2"]);

export const resourceKindEnum = pgEnum("resource_kind", [
  "desk",
  "widget",
  "skill",
  "prompt_include",
  "memory",
  "onboarding_template",
]);

export const channelEnum = pgEnum("channel", ["web", "telegram", "admin"]);

export const toolCallStatusEnum = pgEnum("tool_call_status", [
  "pending",
  "running",
  "done",
  "error",
]);

export const memoryKindEnum = pgEnum("memory_kind", [
  "persistent",
  "transient",
]);

export const planEnum = pgEnum("plan", ["free", "pro"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);

// ─── Users ────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  defaultWorkspaceId: text("default_workspace_id"),
  defaultDeskId: text("default_desk_id"),
  telegramChatId: bigint("telegram_chat_id", { mode: "bigint" }).unique(),
  isGlobalAdmin: boolean("is_global_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workspaces ───────────────────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey().notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id),
  plan: planEnum("plan").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workspace members ────────────────────────────────────────────────────

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })]
);

// ─── Resources (unified L0/L1/L2 table) ──────────────────────────────────

export const resources = pgTable(
  "resources",
  {
    id: text("id").primaryKey().notNull(),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    layer: layerEnum("layer").notNull(),
    kind: resourceKindEnum("kind").notNull(),
    name: text("name").notNull(),
    content: jsonb("content").notNull().default({}),
    metadata: jsonb("metadata").notNull().default({}),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    archivedAt: timestamp("archived_at"),
  },
  (t) => [
    index("resources_workspace_layer_kind_idx").on(
      t.workspaceId,
      t.layer,
      t.kind
    ),
    index("resources_layer_kind_name_idx").on(t.layer, t.kind, t.name),
  ]
);

// ─── Resource versions ────────────────────────────────────────────────────

export const resourceVersions = pgTable(
  "resource_versions",
  {
    id: text("id").primaryKey().notNull(),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    content: jsonb("content").notNull(),
    diff: jsonb("diff"),
    authorId: text("author_id").references(() => users.id),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("resource_versions_resource_idx").on(t.resourceId)]
);

// ─── Widget instances ─────────────────────────────────────────────────────

export const widgetInstances = pgTable(
  "widget_instances",
  {
    id: text("id").primaryKey().notNull(),
    deskId: text("desk_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    resourceId: text("resource_id").references(() => resources.id),
    props: jsonb("props").notNull().default({}),
    layout: jsonb("layout").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("widget_instances_desk_idx").on(t.deskId)]
);

// ─── Conversations ────────────────────────────────────────────────────────

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey().notNull(),
    deskId: text("desk_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull().default("web"),
    title: text("title"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("conversations_desk_user_idx").on(t.deskId, t.userId)]
);

// ─── Messages ─────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey().notNull(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    tokens: integer("tokens"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("messages_conversation_created_idx").on(
      t.conversationId,
      t.createdAt
    ),
  ]
);

// ─── Tool calls ───────────────────────────────────────────────────────────

export const toolCalls = pgTable(
  "tool_calls",
  {
    id: text("id").primaryKey().notNull(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    args: jsonb("args").notNull().default({}),
    status: toolCallStatusEnum("status").notNull().default("pending"),
    output: jsonb("output"),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [index("tool_calls_message_idx").on(t.messageId)]
);

// ─── Telegram links ───────────────────────────────────────────────────────

export const telegramLinks = pgTable("telegram_links", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── API keys (encrypted) ─────────────────────────────────────────────────

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey().notNull(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    ciphertext: bytea("ciphertext").notNull(),
    nonce: bytea("nonce").notNull(),
    keyFingerprint: text("key_fingerprint"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique("api_keys_workspace_provider_uniq").on(t.workspaceId, t.provider)]
);

// ─── Shares ───────────────────────────────────────────────────────────────

export const shares = pgTable("shares", {
  id: text("id").primaryKey().notNull(),
  token: text("token").notNull().unique(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  encrypted: boolean("encrypted").notNull().default(false),
  salt: bytea("salt"),
  expiresAt: timestamp("expires_at"),
  cloneCount: integer("clone_count").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  workspaceId: text("workspace_id")
    .primaryKey()
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  tier: planEnum("tier").notNull().default("free"),
  currentPeriodEnd: timestamp("current_period_end"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Push subscriptions ───────────────────────────────────────────────────

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Audit log ────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey().notNull(),
    workspaceId: text("workspace_id").references(() => workspaces.id),
    actorId: text("actor_id").references(() => users.id),
    action: text("action").notNull(),
    target: text("target"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_log_workspace_idx").on(t.workspaceId)]
);

// ─── Type exports ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type ResourceVersion = typeof resourceVersions.$inferSelect;
export type WidgetInstance = typeof widgetInstances.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ToolCall = typeof toolCalls.$inferSelect;
export type TelegramLink = typeof telegramLinks.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Share = typeof shares.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

export type NewUser = typeof users.$inferInsert;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type NewResource = typeof resources.$inferInsert;
export type NewWidgetInstance = typeof widgetInstances.$inferInsert;
export type NewConversation = typeof conversations.$inferInsert;
export type NewMessage = typeof messages.$inferInsert;
export type NewToolCall = typeof toolCalls.$inferInsert;
