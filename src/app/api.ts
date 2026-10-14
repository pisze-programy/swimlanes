/** Client for the short-link API. Bodies are plain text. */

const endpoint = "/api/diagrams";

export async function saveDiagram(source: string): Promise<string | undefined> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: source,
    });
    if (!response.ok) {
      return undefined;
    }
    const id = (await response.text()).trim();
    if (id.length === 0) {
      return undefined;
    }
    return id;
  } catch {
    return undefined;
  }
}

export async function loadDiagram(id: string): Promise<string | undefined> {
  try {
    const response = await fetch(endpoint + "/" + encodeURIComponent(id));
    if (!response.ok) {
      return undefined;
    }
    return await response.text();
  } catch {
    return undefined;
  }
}
