/** Serve static assets with a single-page-app fallback. */

import type { Env } from "./env";

export async function serveAssets(request: Request, env: Env, url: URL): Promise<Response> {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404) {
    return response;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return response;
  }
  if (url.pathname.includes(".")) {
    return response;
  }
  const fallback = new Request(new URL("/", url.origin).toString(), {
    method: "GET",
    headers: request.headers,
  });
  return env.ASSETS.fetch(fallback);
}
