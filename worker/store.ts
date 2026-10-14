/** Key/value storage for short links. */

import { randomId } from "./ids";

export interface DiagramStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

const maxSourceLength = 256 * 1024;
const idLength = 10;
const idAttempts = 5;

export async function saveDiagram(store: DiagramStore, source: string): Promise<string | undefined> {
  if (source.length === 0 || source.length > maxSourceLength) {
    return undefined;
  }
  for (let attempt = 0; attempt < idAttempts; attempt += 1) {
    const id = randomId(idLength);
    const existing = await store.get(id);
    if (existing === null) {
      await store.put(id, source);
      return id;
    }
  }
  return undefined;
}

export async function loadDiagram(store: DiagramStore, id: string): Promise<string | undefined> {
  const stored = await store.get(id);
  if (stored === null) {
    return undefined;
  }
  return stored;
}
