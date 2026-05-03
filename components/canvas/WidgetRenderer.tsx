import type { DeskWidget } from "@/lib/types";
import {
  BrowserWidget,
  ChartWidget,
  CodeWidget,
  FormWidget,
  IframeWidget,
  KanbanWidget,
  MarkdownWidget,
  TodoWidget,
  RichTextWidget,
  WhiteboardWidget,
} from "@/components/widgets/builtin";

interface WidgetRendererProps {
  widget: DeskWidget;
  isEditing?: boolean;
  onEditDone?: () => void;
}

export function WidgetRenderer({ widget, isEditing, onEditDone }: WidgetRendererProps) {
  switch (widget.type) {
    case "markdown":
      return (
        <MarkdownWidget
          widgetId={widget.id}
          content={widget.props.content}
          isEditing={isEditing}
          onEditDone={onEditDone}
        />
      );
    case "kanban":
      return (
        <KanbanWidget
          widgetId={widget.id}
          columns={widget.props.columns}
          isEditing={isEditing}
        />
      );
    case "browser":
      return <BrowserWidget url={widget.props.url} />;
    case "code":
      return (
        <CodeWidget
          widgetId={widget.id}
          code={widget.props.code}
          language={widget.props.language}
          isEditing={isEditing}
          onEditDone={onEditDone}
        />
      );
    case "chart":
      return <ChartWidget data={widget.props.data} xKey={widget.props.xKey} yKey={widget.props.yKey} />;
    case "form":
      return <FormWidget fields={widget.props.fields} />;
    case "todo":
      return (
        <TodoWidget
          widgetId={widget.id}
          items={widget.props.items}
          isEditing={isEditing}
        />
      );
    case "richtext":
      return <RichTextWidget widgetId={widget.id} html={widget.props.html} />;
    case "whiteboard":
      return <WhiteboardWidget widgetId={widget.id} snapshot={widget.props.snapshot} />;
    case "iframe":
    case "custom":
    default:
      return <IframeWidget widgetInstanceId={widget.id} props={widget.props} />;
  }
}
