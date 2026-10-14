import { describe, expect, it } from "vitest";
import { handleApi } from "../../worker/api";
import { isValidId, randomId } from "../../worker/ids";
import { loadDiagram, saveDiagram } from "../../worker/store";
import type { DiagramStore } from "../../worker/store";

function fakeStore(): DiagramStore {
  const data = new Map<string, string>();
  return {
    get(key: string): Promise<string | null> {
      const value = data.get(key);
      if (value === undefined) {
        return Promise.resolve(null);
      }
      return Promise.resolve(value);
    },
    put(key: string, value: string): Promise<void> {
      data.set(key, value);
      return Promise.resolve();
    },
  };
}

function post(path: string, body: string): Request {
  return new Request("https://example.com" + path, { method: "POST", body });
}

function get(path: string): Request {
  return new Request("https://example.com" + path, { method: "GET" });
}

describe("ids", () => {
  it("makes ids of the asked length in the safe alphabet", () => {
    const id = randomId(10);
    expect(id).toHaveLength(10);
    expect(id).toMatch(/^[0-9A-Za-z]+$/);
  });

  it("validates ids", () => {
    expect(isValidId("abcd1234")).toBe(true);
    expect(isValidId("a")).toBe(false);
    expect(isValidId("bad id!")).toBe(false);
    expect(isValidId("../etc/passwd")).toBe(false);
  });
});

describe("store", () => {
  it("saves and loads a diagram", async () => {
    const store = fakeStore();
    const id = await saveDiagram(store, "A -> B: hi");
    expect(id).toBeDefined();
    if (id === undefined) {
      return;
    }
    expect(isValidId(id)).toBe(true);
    expect(await loadDiagram(store, id)).toBe("A -> B: hi");
  });

  it("rejects an empty diagram", async () => {
    expect(await saveDiagram(fakeStore(), "")).toBeUndefined();
  });

  it("rejects an oversized diagram", async () => {
    expect(await saveDiagram(fakeStore(), "x".repeat(300 * 1024))).toBeUndefined();
  });

  it("returns undefined for an unknown id", async () => {
    expect(await loadDiagram(fakeStore(), "missing")).toBeUndefined();
  });
});

describe("handleApi", () => {
  it("saves then loads", async () => {
    const store = fakeStore();
    const saved = await handleApi(post("/api/diagrams", "A -> B: hi"), store);
    expect(saved.status).toBe(201);
    const id = (await saved.text()).trim();
    const loaded = await handleApi(get("/api/diagrams/" + id), store);
    expect(loaded.status).toBe(200);
    expect(await loaded.text()).toBe("A -> B: hi");
  });

  it("rejects an invalid id", async () => {
    const response = await handleApi(get("/api/diagrams/..%2Fetc"), fakeStore());
    expect(response.status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    expect((await handleApi(get("/api/diagrams/abcdefgh"), fakeStore())).status).toBe(404);
  });

  it("rejects an oversized body", async () => {
    const response = await handleApi(post("/api/diagrams", "x".repeat(300 * 1024)), fakeStore());
    expect(response.status).toBe(413);
  });

  it("rejects unsupported methods", async () => {
    expect((await handleApi(get("/api/diagrams"), fakeStore())).status).toBe(405);
    expect((await handleApi(new Request("https://example.com/api/diagrams/x", { method: "DELETE" }), fakeStore())).status).toBe(405);
  });
});
