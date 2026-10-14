/** Short-link API. Request and response bodies are plain text. */

import { isValidId } from "./ids";
import { textResponse } from "./responses";
import { loadDiagram, saveDiagram } from "./store";
import type { DiagramStore } from "./store";

const prefix = "/api/diagrams";
const maxRequestBytes = 256 * 1024;

export async function handleApi(request: Request, store: DiagramStore): Promise<Response> {
  const url = new URL(request.url);
  const rest = url.pathname.slice(prefix.length);
  if (rest === "" || rest === "/") {
    if (request.method === "POST") {
      return handleSave(request, store);
    }
    return textResponse("method not allowed", 405);
  }
  const id = rest.startsWith("/") ? rest.slice(1) : rest;
  if (request.method === "GET") {
    return handleLoad(store, id);
  }
  return textResponse("method not allowed", 405);
}

async function handleSave(request: Request, store: DiagramStore): Promise<Response> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number.parseInt(declared, 10);
    if (Number.isFinite(length) && length > maxRequestBytes) {
      return textResponse("diagram is too large", 413);
    }
  }
  const source = await request.text();
  if (source.length > maxRequestBytes) {
    return textResponse("diagram is too large", 413);
  }
  const id = await saveDiagram(store, source);
  if (id === undefined) {
    return textResponse("invalid diagram", 400);
  }
  return textResponse(id, 201);
}

async function handleLoad(store: DiagramStore, id: string): Promise<Response> {
  if (!isValidId(id)) {
    return textResponse("not found", 404);
  }
  const source = await loadDiagram(store, id);
  if (source === undefined) {
    return textResponse("not found", 404);
  }
  return textResponse(source, 200);
}
