import type { FormField } from "@/lib/types";

function isFormField(value: unknown): value is FormField {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string"
  );
}

export function FormWidget({ fields }: { fields?: unknown }) {
  const safeFields = Array.isArray(fields) ? fields.filter(isFormField) : [];

  if (!safeFields.length) {
    return <div className="flex h-full items-center justify-center text-sm text-[--color-muted-foreground]">No form fields</div>;
  }

  return (
    <form className="space-y-3 overflow-auto">
      {safeFields.map((field) => (
        <label key={field.name} className="block text-sm text-[--color-foreground]">
          <span className="mb-1 block text-xs text-[--color-muted-foreground]">
            {field.label ?? field.name}
            {field.required ? " *" : ""}
          </span>
          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder}
              className="min-h-20 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none"
            />
          ) : field.type === "checkbox" ? (
            <input name={field.name} type="checkbox" className="h-5 w-5 rounded border-white/10 bg-white/5" />
          ) : (
            <input
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              className="min-h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none"
            />
          )}
        </label>
      ))}
    </form>
  );
}
