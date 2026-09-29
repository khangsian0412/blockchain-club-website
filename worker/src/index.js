import { createPublicClient, http, isAddress, verifyMessage } from "viem";

const membershipAbi = [{ type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }] }];

function headers(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN;
  return { "Access-Control-Allow-Origin": origin && origin === allowedOrigin ? allowedOrigin : "null", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", Vary: "Origin" };
}

function eventLabel(url) {
  const segment = new URL(url).pathname.split("/").filter(Boolean).pop()?.replaceAll("-", " ");
  return segment ? segment.replace(/\b\w/g, (character) => character.toUpperCase()) : `Event on ${new URL(url).hostname}`;
}

function metaContent(html, names) {
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]?.trim();
    if (name && content && wanted.has(name)) {
      return content.replaceAll("&amp;", "&").replaceAll("&quot;", "\"").replaceAll("&#x27;", "'");
    }
  }
  return null;
}

async function eventPreview(url) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "NUS Blockchain Club event directory preview" } });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return {};
    const html = await response.text();
    const title = metaContent(html, ["og:title", "twitter:title"]) ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    const description = metaContent(html, ["og:description", "twitter:description"]);
    const imageUrl = metaContent(html, ["og:image", "twitter:image"]);
    return {
      title: title?.slice(0, 140),
      description: description?.slice(0, 240),
      imageUrl: imageUrl ? new URL(imageUrl, url).toString() : null,
    };
  } catch { return {}; }
}

function json(request, env, body, status = 200) { return Response.json(body, { status, headers: headers(request, env) }); }

export default {
  async fetch(request, env) {
    const responseHeaders = headers(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers: responseHeaders });
    if (request.headers.get("Origin") && request.headers.get("Origin") !== env.ALLOWED_ORIGIN) return json(request, env, { error: "Origin is not allowed." }, 403);

    if (request.method === "GET") {
      const { results } = await env.nus_blockchain_club_events.prepare("SELECT id, url, label, description, image_url, created_at FROM events ORDER BY created_at DESC LIMIT 50").all();
      return json(request, env, { events: results.map((event) => ({ id: event.id, url: event.url, label: event.label, description: event.description, imageUrl: event.image_url, postedAt: event.created_at })) });
    }
    if (request.method !== "POST") return json(request, env, { error: "Method not allowed." }, 405);

    try {
      const { address, message, signature, url } = await request.json();
      if (!isAddress(address) || typeof message !== "string" || typeof signature !== "string" || typeof url !== "string") throw new Error("Invalid event submission.");
      const parsedUrl = new URL(url);
      if (!["https:", "http:"].includes(parsedUrl.protocol)) throw new Error("Event URL must use http or https.");
      const normalizedUrl = parsedUrl.toString();
      if (message !== `Post an NUS Blockchain Club event: ${normalizedUrl}`) throw new Error("Invalid event approval message.");
      if (!await verifyMessage({ address, message, signature })) throw new Error("Wallet signature could not be verified.");

      const client = createPublicClient({ transport: http(env.SEPOLIA_RPC_URL) });
      const balance = await client.readContract({ address: env.MEMBERSHIP_CONTRACT, abi: membershipAbi, functionName: "balanceOf", args: [address] });
      if (balance <= 0n) return json(request, env, { error: "A club membership is required to post." }, 403);

      const preview = await eventPreview(normalizedUrl);
      const existing = await env.nus_blockchain_club_events.prepare("SELECT id, created_at FROM events WHERE url = ?").bind(normalizedUrl).first();
      const event = { id: existing?.id ?? crypto.randomUUID(), url: normalizedUrl, label: preview.title || eventLabel(normalizedUrl), description: preview.description || null, imageUrl: preview.imageUrl || null, postedAt: existing?.created_at ?? new Date().toISOString() };
      if (existing) {
        await env.nus_blockchain_club_events.prepare("UPDATE events SET label = ?, description = ?, image_url = ? WHERE id = ?").bind(event.label, event.description, event.imageUrl, event.id).run();
      } else {
        await env.nus_blockchain_club_events.prepare("INSERT INTO events (id, url, label, description, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(event.id, event.url, event.label, event.description, event.imageUrl, event.postedAt).run();
      }
      return json(request, env, { event }, existing ? 200 : 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not publish event.";
      return json(request, env, { error: message }, 400);
    }
  },
};
