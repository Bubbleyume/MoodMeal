import { unzipSync, strFromU8 } from "fflate";
export async function readResource(
  file: File,
): Promise<{ units: { location: string; text: string }[]; notice: string }> {
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose a resource smaller than 25 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/assets/pdf.worker.min.js";
    const task = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      useSystemFonts: true,
    });
    const pdf = await task.promise;
    const units: { location: string; text: string }[] = [];
    try {
      if (pdf.numPages > 600)
        throw new Error(
          "This resource exceeds the 600-page import limit. Split it into sections.",
        );
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((x) => ("str" in x ? x.str : ""))
          .join(" ");
        if (text.trim()) units.push({ location: `PDF page ${i}`, text });
      }
      return {
        units,
        notice: `Read text from ${units.length} of ${pdf.numPages} PDF pages. Scanned/image-only pages require OCR outside MoodMeal.`,
      };
    } finally {
      await task.destroy();
    }
  }
  if (ext === "epub") {
    let expanded = 0;
    const zip = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => {
        if (!/\.(xhtml|html|htm)$/i.test(entry.name)) return false;
        expanded += entry.originalSize;
        if (expanded > 20 * 1024 * 1024)
          throw new Error("EPUB text exceeds the 20 MB extraction limit.");
        return true;
      },
    });
    const units = Object.entries(zip).map(([location, data]) => {
      const doc = new DOMParser().parseFromString(strFromU8(data), "text/html");
      doc.querySelectorAll("script,style").forEach((n) => n.remove());
      return { location, text: doc.body.textContent ?? "" };
    });
    return {
      units,
      notice: `Read ${units.length} EPUB text sections. Image-only content is not extracted.`,
    };
  }
  if (!["txt", "md", "json"].includes(ext ?? ""))
    throw new Error(
      "Choose PDF, EPUB, TXT, Markdown or a MoodMeal JSON export.",
    );
  const text = await file.text();
  if (text.length > 2000000)
    throw new Error(
      "Text exceeds the 2-million-character limit. Split it into sections.",
    );
  return {
    units: [{ location: file.name, text }],
    notice: "Local text extraction complete.",
  };
}
