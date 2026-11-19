export type Attachment = { id: string; name: string; url: string; size: number };

/** Builds one PDF: the rendered quotation pages (A4) followed by the chosen PDF attachments, in order. */
export async function buildQuotePdf(pages: HTMLCanvasElement[], attachments: Attachment[]): Promise<{ bytes: Uint8Array; skipped: string[] }> {
  const { PDFDocument } = await import('pdf-lib');
  const out = await PDFDocument.create();
  for (const c of pages) {
    const jpg = await out.embedJpg(await new Promise<ArrayBuffer>((res, rej) => c.toBlob(b => (b ? b.arrayBuffer().then(res, rej) : rej(new Error('canvas empty'))), 'image/jpeg', 0.92)));
    const page = out.addPage([595.28, 841.89]);
    page.drawImage(jpg, { x: 0, y: 0, width: 595.28, height: 841.89 });
  }
  const skipped: string[] = [];
  for (const a of attachments) {
    try {
      const res = await fetch(a.url);
      if (!res.ok) throw new Error(String(res.status));
      const src = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach(p => out.addPage(p));
    } catch { skipped.push(a.name); }
  }
  out.setTitle('ใบเสนอราคา'); out.setProducer('BGE SolarTech');
  return { bytes: await out.save(), skipped };
}
