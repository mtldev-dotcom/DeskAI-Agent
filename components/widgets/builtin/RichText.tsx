"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Heading2, List, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextWidgetProps {
  widgetId: string;
  html?: unknown;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function patchWidget(widgetId: string, html: string) {
  await fetch(`/api/widgets/${encodeURIComponent(widgetId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ props: { html } }),
  });
}

export function RichTextWidget({ widgetId, html: rawHtml }: RichTextWidgetProps) {
  const initialHtml = typeof rawHtml === "string" ? rawHtml : "<p>Start writing here…</p>";
  const widgetIdRef = useRef(widgetId);
  widgetIdRef.current = widgetId;

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-full outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        patchWidget(widgetIdRef.current, ed.getHTML()).catch(() => {/* silent */});
      }, 1500);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, []);

  if (!editor) return null;

  const toolbarBtn = (active: boolean, onClick: () => void, label: string, children: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-xs transition-colors",
        active
          ? "bg-white/15 text-[--color-foreground]"
          : "text-[--color-muted-foreground] hover:bg-white/5 hover:text-[--color-foreground]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-white/10 pb-2">
        {toolbarBtn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold", <Bold size={13} />)}
        {toolbarBtn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic", <Italic size={13} />)}
        {toolbarBtn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Heading", <Heading2 size={13} />)}
        {toolbarBtn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "List", <List size={13} />)}
        {toolbarBtn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), "Code", <Code size={13} />)}
      </div>

      {/* Editor area */}
      <div className="min-h-0 flex-1 overflow-y-auto [&_.ProseMirror]:min-h-full [&_.ProseMirror]:text-sm [&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-1 [&_.ProseMirror_p]:mb-1 [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_li]:mb-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-white/10 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:text-xs">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
