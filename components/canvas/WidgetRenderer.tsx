import type { DeskWidget } from "@/lib/types";
import {
  BrowserWidget,
  ChartWidget,
  CodeWidget,
  FormWidget,
  IframeWidget,
  KanbanWidget,
  MarkdownWidget,
} from "@/components/widgets/builtin";

interface WidgetRendererProps {
  widget: DeskWidget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.type) {
    case "markdown":
      return <MarkdownWidget content={widget.props.content} />;
    case "kanban":
      return <KanbanWidget columns={widget.props.columns} />;
    case "browser":
      return <BrowserWidget url={widget.props.url} />;
    case "code":
      return <CodeWidget code={widget.props.code} language={widget.props.language} />;
    case "chart":
      return <ChartWidget data={widget.props.data} xKey={widget.props.xKey} yKey={widget.props.yKey} />;
    case "form":
      return <FormWidget fields={widget.props.fields} />;
    case "iframe":
    case "custom":
      return <IframeWidget widgetInstanceId={widget.id} props={widget.props} />;
    default:
      return <IframeWidget widgetInstanceId={widget.id} props={widget.props} />;
  }
}
