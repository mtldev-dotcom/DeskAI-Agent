"use client";

interface MarkdownPatcherProps {
  text: string;
}

export function MarkdownPatcher({ text }: MarkdownPatcherProps) {
  return <div className="whitespace-pre-wrap break-words leading-relaxed">{text}</div>;
}
