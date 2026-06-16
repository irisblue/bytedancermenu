#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputDir = resolve(root, "supabase/functions/workspace-menu");
const outputFile = resolve(outputDir, "index.ts");

const htmlPath = resolve(root, "index.html");
const cssPath = resolve(root, "styles.css");
const jsPath = resolve(root, "app.js");

let html = readFileSync(htmlPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const js = readFileSync(jsPath, "utf8");

html = html.replace(
  /<link rel="stylesheet" href="styles\.css[^"]*">/,
  () => `<style>\n${css}\n</style>`
);

html = html.replace(
  /<script src="app\.js[^"]*"><\/script>/,
  () => `<script>\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>`
);

const chunks = Buffer.from(html, "utf8")
  .toString("base64")
  .match(/.{1,12000}/g) || [];

const source = `const html = new TextDecoder().decode(
  Uint8Array.from(atob([
${chunks.map((chunk) => `    ${JSON.stringify(chunk)}`).join(",\n")}
  ].join("")), (char) => char.charCodeAt(0))
);

const headers = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=60",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey",
} as const;

const jsonHeaders = {
  ...headers,
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

const allowedEventTypes = new Set(["page_view", "dish_feedback"]);
const allowedVotes = new Set(["up", "down"]);

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  const url = new URL(req.url);
  if (req.method === "POST" && url.pathname.endsWith("/events")) {
    return insertAnalyticsEvent(req);
  }

  if (req.method !== "GET") {
    return new Response("Not Found", { status: 404, headers });
  }

  return new Response(html, { headers });
}

async function insertAnalyticsEvent(req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "analytics_env_missing" }), { status: 503, headers: jsonHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: jsonHeaders });
  }

  const row = normalizeAnalyticsEvent(body);
  if (!row) {
    return new Response(JSON.stringify({ error: "invalid_event" }), { status: 400, headers: jsonHeaders });
  }

  const response = await fetch(\`\${supabaseUrl}/rest/v1/menu_events\`, {
    method: "POST",
    headers: {
      "apikey": serviceRoleKey,
      "authorization": \`Bearer \${serviceRoleKey}\`,
      "content-type": "application/json",
      "prefer": "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(JSON.stringify({ error: "insert_failed", detail: text.slice(0, 240) }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
}

function normalizeAnalyticsEvent(input: Record<string, unknown>): Record<string, unknown> | null {
  const eventType = stringValue(input.event_type, 40);
  if (!eventType || !allowedEventTypes.has(eventType)) return null;

  const vote = stringValue(input.vote, 12);
  if (vote && !allowedVotes.has(vote)) return null;

  return {
    event_type: eventType,
    event_date: stringValue(input.event_date, 12) || new Date().toISOString().slice(0, 10),
    session_id: stringValue(input.session_id, 120) || "anonymous",
    meal: stringValue(input.meal, 24),
    work_area: stringValue(input.work_area, 80),
    floor: stringValue(input.floor, 32),
    station: stringValue(input.station, 120),
    dish_name: stringValue(input.dish_name, 160),
    vote: vote || null,
    payload: typeof input.payload === "object" && input.payload !== null ? input.payload : {},
    user_agent: stringValue(input.user_agent, 400),
  };
}

function stringValue(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}
`;

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, source);
console.log(`Built ${outputFile}`);
