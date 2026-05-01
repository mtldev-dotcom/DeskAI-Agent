export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type WidgetType = "markdown" | "kanban" | "browser" | "code" | "chart" | "form" | "iframe";

export interface DeskWidget {
  id: string;
  type: WidgetType | "custom";
  name: string;
  props: Record<string, unknown>;
  layout: WidgetLayout;
}

export interface KanbanCard {
  id?: string;
  title: string;
  body?: string;
}

export interface KanbanColumn {
  id?: string;
  title: string;
  cards?: KanbanCard[];
}

export interface ChartDatum {
  label: string;
  value: number;
}

export interface FormField {
  name: string;
  label?: string;
  type?: "text" | "email" | "number" | "textarea" | "checkbox";
  placeholder?: string;
  required?: boolean;
}
