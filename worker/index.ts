import { handleApi } from "./api";
import { serveAssets } from "./assets";
import type { Env } from "./env";
import { textResponse } from "./responses";
import type { DiagramStore } from "./store";

function storeFromEnv(env: Env): DiagramStore {
  return {
    get: (key) => env.DIAGRAMS.get(key),
    put: (key, value) => env.DIAGRAMS.put(key, value),
  };
}

const worker: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return textResponse("ok", 200);
    }
    if (url.pathname === "/api/diagrams" || url.pathname.startsWith("/api/diagrams/")) {
      return handleApi(request, storeFromEnv(env));
    }
    return serveAssets(request, env, url);
  },
};

export default worker;
