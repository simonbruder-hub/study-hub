/**
 * PDF im Browser anzeigen (PDF.js), Seite für Seite als Bild, erst wenn sie in die Nähe des
 * sichtbaren Bereichs kommt. Ohne Textebene und ohne Knopf zum Speichern.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

async function renderPage(pdf: PDFDocumentProxy, box: HTMLElement) {
  const page = await pdf.getPage(Number(box.dataset.page));
  const base = page.getViewport({ scale: 1 });
  const scale = (Math.min(2, window.devicePixelRatio || 1) * Math.max(box.clientWidth, 320)) / base.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  box.append(canvas);
  await page.render({ canvas, viewport }).promise;
}

export function PdfViewer({ data, label }: { data: Uint8Array; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    // PDF.js übernimmt den Speicher; eine Kopie, damit die Daten zum Herunterladen bleiben.
    // Ohne Formulare (XFA) und ohne Skripte des PDFs.
    const task = getDocument({ data: data.slice(), enableXfa: false });
    task.promise.then(async (pdf) => {
      if (cancelled || !host.current) return;
      const el = host.current;
      el.textContent = '';
      setPages(pdf.numPages);
      observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          observer?.unobserve(e.target);
          renderPage(pdf, e.target as HTMLElement).catch(() => { if (!cancelled) setFailed(true); });
        }
      }, { rootMargin: '800px 0px' });
      for (let n = 1; n <= pdf.numPages; n++) {
        const { width, height } = (await pdf.getPage(n)).getViewport({ scale: 1 });
        if (cancelled) return;
        const box = document.createElement('div');
        box.className = 'pdf-page';
        box.dataset.page = String(n);
        box.style.aspectRatio = `${width} / ${height}`;
        box.setAttribute('role', 'img');
        box.setAttribute('aria-label', `${label}, Seite ${n} von ${pdf.numPages}`);
        el.append(box);
        observer.observe(box);
      }
    }, () => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      observer?.disconnect();
      void task.destroy();
    };
  }, [data]);

  return (
    <section class="viewer" aria-label={`Ansicht: ${label}`} onContextMenu={(e) => e.preventDefault()}>
      {failed && <p class="note note-bad">Das PDF lässt sich nicht anzeigen.</p>}
      {!pages && !failed && <p class="muted">Seiten werden vorbereitet …</p>}
      <div ref={host} class="stack" style={{ width: '100%', justifyItems: 'center' }} data-pages={pages} />
    </section>
  );
}
