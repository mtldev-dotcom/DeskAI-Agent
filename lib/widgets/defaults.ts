import type { WidgetType, WidgetLayout } from "@/lib/types";

export type WidgetCategory = "productivity" | "content" | "web";

export interface WidgetDefinition {
  type: WidgetType | "crm";
  label: string;
  description: string;
  category: WidgetCategory;
  icon: string;
  defaultProps: Record<string, unknown>;
  defaultLayout: Omit<WidgetLayout, "x" | "y">;
  resolvedType: WidgetType;
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    type: "todo",
    resolvedType: "todo",
    label: "Todo List",
    description: "Checkboxes with persistent state",
    category: "productivity",
    icon: "CheckSquare",
    defaultProps: {
      items: [
        { id: "1", text: "First task", done: false },
        { id: "2", text: "Second task", done: false },
      ],
    },
    defaultLayout: { w: 6, h: 7, minW: 3, minH: 4 },
  },
  {
    type: "kanban",
    resolvedType: "kanban",
    label: "Kanban Board",
    description: "Visual task columns",
    category: "productivity",
    icon: "Columns",
    defaultProps: {
      columns: [
        { id: "todo", title: "To Do", cards: [] },
        { id: "inprogress", title: "In Progress", cards: [] },
        { id: "done", title: "Done", cards: [] },
      ],
    },
    defaultLayout: { w: 12, h: 9, minW: 6, minH: 5 },
  },
  {
    type: "crm",
    resolvedType: "kanban",
    label: "CRM Pipeline",
    description: "Deal pipeline board",
    category: "productivity",
    icon: "Briefcase",
    defaultProps: {
      columns: [
        { id: "leads", title: "Leads", cards: [] },
        { id: "qualified", title: "Qualified", cards: [] },
        { id: "proposal", title: "Proposal", cards: [] },
        { id: "closed_won", title: "Closed Won", cards: [] },
        { id: "closed_lost", title: "Closed Lost", cards: [] },
      ],
    },
    defaultLayout: { w: 12, h: 9, minW: 8, minH: 5 },
  },
  {
    type: "markdown",
    resolvedType: "markdown",
    label: "Notes",
    description: "Freeform markdown notes",
    category: "content",
    icon: "FileText",
    defaultProps: {
      content: "## Notes\n\nStart writing here…",
    },
    defaultLayout: { w: 6, h: 6, minW: 3, minH: 3 },
  },
  {
    type: "richtext",
    resolvedType: "richtext",
    label: "Rich Text",
    description: "WYSIWYG text editor",
    category: "content",
    icon: "Type",
    defaultProps: {
      html: "<p>Start writing here…</p>",
    },
    defaultLayout: { w: 6, h: 7, minW: 3, minH: 4 },
  },
  {
    type: "whiteboard",
    resolvedType: "whiteboard",
    label: "Whiteboard",
    description: "Freehand drawing canvas",
    category: "content",
    icon: "PenLine",
    defaultProps: {
      snapshot: null,
    },
    defaultLayout: { w: 8, h: 10, minW: 4, minH: 6 },
  },
  {
    type: "code",
    resolvedType: "code",
    label: "Code Block",
    description: "Syntax-highlighted code viewer",
    category: "content",
    icon: "Code2",
    defaultProps: {
      code: "// Write your code here\nconsole.log('Hello, world!');",
      language: "javascript",
    },
    defaultLayout: { w: 6, h: 6, minW: 3, minH: 3 },
  },
  {
    type: "browser",
    resolvedType: "browser",
    label: "Browser",
    description: "Embedded web page",
    category: "web",
    icon: "Globe",
    defaultProps: {
      url: "https://example.com",
    },
    defaultLayout: { w: 8, h: 10, minW: 4, minH: 6 },
  },
];

export function getDefinition(type: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find((d) => d.type === type);
}
