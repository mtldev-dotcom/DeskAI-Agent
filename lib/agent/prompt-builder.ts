import type { ChatMessage } from "./openrouter-client";
import type { LoadedSkill } from "./skills-loader";

interface PromptBuilderInput {
  deskSystemPrompt?: string;
  skills: { system: LoadedSkill[]; history: LoadedSkill[]; transient: LoadedSkill[] };
  persistentMemories: string;
  history: ChatMessage[];
  userText: string;
  channel: string;
  deskName?: string;
  activeWidgetTypes?: string[];
  /** Approximate token budget for history before summarization kicks in */
  maxHistoryTokens?: number;
}

/** Rough token estimate: 1 token ≈ 4 chars */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function skillsToText(skills: LoadedSkill[]): string {
  return skills.map((s) => `### Skill: ${s.name}\n\n${s.body}`).join("\n\n---\n\n");
}

/**
 * Assembles the full messages array for an OpenRouter request.
 * Order: system(skills) → persistent memory → history(skills injected) → transient → user
 */
export function buildPrompt(input: PromptBuilderInput): ChatMessage[] {
  const {
    deskSystemPrompt,
    skills,
    persistentMemories,
    history,
    userText,
    channel,
    deskName,
    activeWidgetTypes = [],
    maxHistoryTokens = 8000,
  } = input;

  const systemParts: string[] = [];

  // Base identity
  systemParts.push(
    [
      "You are the DesksAI Agent — an AI that helps users build and manage their Desks.",
      deskName ? `Current Desk: **${deskName}**` : "",
      `Channel: ${channel}`,
      activeWidgetTypes.length
        ? `Active widgets: ${activeWidgetTypes.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")
  );

  // Desk-level system prompt
  if (deskSystemPrompt?.trim()) {
    systemParts.push(`## Desk Instructions\n\n${deskSystemPrompt.trim()}`);
  }

  // System-placement skills
  if (skills.system.length) {
    systemParts.push(skillsToText(skills.system));
  }

  // Persistent memories
  if (persistentMemories.trim()) {
    systemParts.push(persistentMemories.trim());
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemParts.join("\n\n---\n\n") },
  ];

  // History-placement skills injected at start of history
  if (skills.history.length) {
    messages.push({
      role: "system",
      content: skillsToText(skills.history),
    });
  }

  // Compact history to stay within token budget
  let tokenCount = 0;
  const trimmedHistory: ChatMessage[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    tokenCount += estimateTokens(text);
    if (tokenCount > maxHistoryTokens) break;
    trimmedHistory.unshift(msg);
  }

  messages.push(...trimmedHistory);

  // Transient-placement skills just before current user message
  if (skills.transient.length) {
    messages.push({
      role: "system",
      content: skillsToText(skills.transient),
    });
  }

  // User message
  messages.push({ role: "user", content: userText });

  return messages;
}
