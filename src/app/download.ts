/** Save the diagram as SVG or PNG. */

interface FontFaceSpec {
  readonly family: string;
  readonly weight: number;
  readonly url: string;
}

const fontFaces: readonly FontFaceSpec[] = [
  { family: "Font Awesome 7 Free", weight: 900, url: "/fa/fa-solid-900.woff2" },
  { family: "Font Awesome 7 Free", weight: 400, url: "/fa/fa-regular-400.woff2" },
  { family: "Font Awesome 7 Brands", weight: 400, url: "/fa/fa-brands-400.woff2" },
];

let cachedFontStyle: string | undefined;

function triggerDownload(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function fetchBase64(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  } catch {
    return undefined;
  }
}

/** Build @font-face rules with embedded data so the raster image has icons. */
async function fontStyle(): Promise<string> {
  if (cachedFontStyle !== undefined) {
    return cachedFontStyle;
  }
  const rules: string[] = [];
  for (const face of fontFaces) {
    const data = await fetchBase64(face.url);
    if (data === undefined) {
      continue;
    }
    rules.push(
      "@font-face{font-family:" +
        '"' +
        face.family +
        '"' +
        ";font-weight:" +
        face.weight +
        ";src:url(data:font/woff2;base64," +
        data +
        ")}",
    );
  }
  cachedFontStyle = rules.join("");
  return cachedFontStyle;
}

function embedFonts(svg: string, style: string): string {
  if (style.length === 0) {
    return svg;
  }
  const close = svg.indexOf(">");
  if (close < 0) {
    return svg;
  }
  return svg.slice(0, close + 1) + "<style>" + style + "</style>" + svg.slice(close + 1);
}

export async function downloadPng(svg: string, width: number, height: number, filename: string): Promise<void> {
  const style = await fontStyle();
  const blob = new Blob([embedFonts(svg, style)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const scale = 2;
  const image = new Image();
  image.onload = (): void => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext("2d");
    if (context === null) {
      URL.revokeObjectURL(url);
      return;
    }
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob((png) => {
      if (png !== null) {
        const pngUrl = URL.createObjectURL(png);
        triggerDownload(pngUrl, filename);
        window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      }
      URL.revokeObjectURL(url);
    }, "image/png");
  };
  image.onerror = (): void => URL.revokeObjectURL(url);
  image.src = url;
}
