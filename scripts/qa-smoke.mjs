const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...options,
  });
  const body = await response.text();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [
  {
    name: "health endpoint returns ok",
    async run() {
      const { response, body } = await request("/api/health");
      assert(response.status === 200, `expected 200, got ${response.status}`);
      const json = JSON.parse(body);
      assert(json.ok === true, "expected ok=true");
    },
  },
  {
    name: "manifest is available",
    async run() {
      const { response, body } = await request("/manifest.json");
      assert(response.status === 200, `expected 200, got ${response.status}`);
      const json = JSON.parse(body);
      assert(json.name || json.short_name, "expected manifest name or short_name");
    },
  },
  {
    name: "chat stream is protected",
    async run() {
      const { response, body } = await request("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "" }),
      });
      assert(
        response.status === 307 || response.status === 308 || response.status === 302,
        `expected redirect, got ${response.status}: ${body}`
      );
      const location = response.headers.get("location") ?? "";
      assert(location.includes("sign-in"), "expected auth redirect");
    },
  },
  {
    name: "desks page is protected",
    async run() {
      const { response } = await request("/desks");
      assert(
        response.status === 307 || response.status === 308 || response.status === 302,
        `expected redirect, got ${response.status}`
      );
      const location = response.headers.get("location") ?? "";
      assert(location.includes("sign-in"), "expected auth redirect");
    },
  },
];

console.log(`QA smoke target: ${baseUrl}`);

for (const check of checks) {
  try {
    await check.run();
    console.log(`PASS ${check.name}`);
  } catch (error) {
    console.error(`FAIL ${check.name}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
