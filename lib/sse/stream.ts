export function writeEvent(controller: ReadableStreamDefaultController, payload: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

export function writeError(controller: ReadableStreamDefaultController, error: unknown) {
  writeEvent(controller, {
    type: "error",
    error: error instanceof Error ? error.message : String(error),
  });
}

export function writeDone(controller: ReadableStreamDefaultController) {
  writeEvent(controller, { type: "done" });
}
