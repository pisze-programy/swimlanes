import { layoutDiagram, parseDiagram, renderSvg } from "../core";
import { loadDiagram, saveDiagram } from "./api";
import { requireElement } from "./dom";
import { downloadPng, downloadSvg } from "./download";
import { defaultSource, examples } from "./examples";
import { createCanvasMeasure } from "./measure";
import {
  copyText,
  currentShareUrl,
  readHashSource,
  readShortId,
  shortUrl,
  writeShareUrl,
  writeShortUrl,
} from "./url";
import "./style.css";

async function initialSource(): Promise<string> {
  const shortId = readShortId();
  if (shortId !== undefined) {
    const loaded = await loadDiagram(shortId);
    if (loaded !== undefined) {
      return loaded;
    }
  }
  const hashSource = readHashSource();
  if (hashSource !== undefined) {
    return hashSource;
  }
  return defaultSource;
}

async function loadFonts(): Promise<void> {
  const requests = [
    '900 14px "Font Awesome 7 Free"',
    '400 14px "Font Awesome 7 Free"',
    '400 14px "Font Awesome 7 Brands"',
  ];
  for (const request of requests) {
    try {
      await document.fonts.load(request);
    } catch {
      // The font is optional. Keep the layout without it.
    }
  }
}

async function bootstrap(): Promise<void> {
  const editor = requireElement<HTMLTextAreaElement>("#editor");
  const preview = requireElement<HTMLDivElement>("#preview");
  const status = requireElement<HTMLSpanElement>("#status");
  const examplesSelect = requireElement<HTMLSelectElement>("#examples");
  const saveButton = requireElement<HTMLButtonElement>("#save");
  const copyButton = requireElement<HTMLButtonElement>("#copy");
  const svgButton = requireElement<HTMLButtonElement>("#svg");
  const pngButton = requireElement<HTMLButtonElement>("#png");

  const measure = createCanvasMeasure();
  let currentSvg = "";
  let currentWidth = 0;
  let currentHeight = 0;

  const render = (): void => {
    try {
      const diagram = parseDiagram(editor.value);
      const layout = layoutDiagram(diagram, measure);
      currentSvg = renderSvg(layout, measure);
      currentWidth = layout.width;
      currentHeight = layout.height;
      preview.innerHTML = currentSvg;
    } catch {
      status.textContent = "cannot render";
    }
  };

  const update = (): void => {
    render();
    writeShareUrl(editor.value);
  };

  for (const example of examples) {
    const option = document.createElement("option");
    option.value = example.id;
    option.textContent = example.title;
    examplesSelect.append(option);
  }

  editor.value = await initialSource();
  render();

  examplesSelect.addEventListener("change", () => {
    const selected = examples.find((example) => example.id === examplesSelect.value);
    if (selected !== undefined) {
      editor.value = selected.source;
      update();
    }
  });

  let timer = 0;
  editor.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(update, 120);
  });

  document.fonts.ready.then(loadFonts).then(render).catch(() => undefined);

  saveButton.addEventListener("click", () => {
    window.clearTimeout(timer);
    render();
    status.textContent = "saving…";
    void saveDiagram(editor.value).then(async (id) => {
      if (id === undefined) {
        status.textContent = "save failed";
        return;
      }
      writeShortUrl(id);
      const copied = await copyText(shortUrl(id));
      status.textContent = copied ? "saved, link copied" : "saved";
    });
  });

  copyButton.addEventListener("click", () => {
    void copyText(currentShareUrl(editor.value)).then((copied) => {
      status.textContent = copied ? "link copied" : "copy failed";
    });
  });

  svgButton.addEventListener("click", () => downloadSvg(currentSvg, "diagram.svg"));
  pngButton.addEventListener("click", () => {
    void downloadPng(currentSvg, currentWidth, currentHeight, "diagram.png");
  });
}

void bootstrap();
