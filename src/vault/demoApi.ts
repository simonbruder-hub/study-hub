/**
 * Ablage ohne Server: Beispieldaten im Speicher des Browsers, für den Demo-Build und die
 * End-to-End-Tests. Die Regeln sind vereinfacht nachgebildet; massgebend ist supabase/schema.sql.
 * Anmelden: Adresse mit @students.example.ch, Code 123456; admin@students.example.ch ist Admin.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { VaultError, type VaultApi } from './api';
import { footerText } from './labels';
import type {
  AllowedLogin, DocFields, DocMeta, ModDoc, Module, MyUpload, OpenReport, Program, ProgramModule, ReportReason, Session,
} from './types';
import { watermark } from './watermark';

export const DEMO_CODE = '123456';
export const DEMO_ADMIN = 'admin@students.example.ch';

interface Doc extends ModDoc {
  uploaded_by: string;
  sha256: string;
  original: Uint8Array | null;
  published: Uint8Array | null;
}
interface Profile { rules: boolean; blocked: boolean }
interface Report extends OpenReport { reported_by: string; resolved: boolean }

const META_KEYS = [
  'id', 'title', 'doc_type', 'module_id', 'solution_of', 'solution_kind', 'includes_solution', 'year', 'term', 'author',
  'provenance', 'alumni_year', 'old_plan_module', 'description', 'page_count', 'size_bytes', 'status', 'reviewed_at', 'created_at',
] as const;

function meta(d: Doc): DocMeta {
  return Object.fromEntries(META_KEYS.map((k) => [k, d[k]])) as unknown as DocMeta;
}

function modDoc(d: Doc, openReports: number): ModDoc {
  return {
    ...meta(d), uploader_email: d.uploader_email, open_reports: openReports, original_path: d.original_path,
    public_path: d.public_path, review_note: d.review_note,
  };
}

/** Beispiel-PDF mit ein paar Seiten Platzhaltertext */
export async function samplePdf(title: string, pages = 2): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= pages; i++) {
    const page = pdf.addPage([595, 842]);
    page.drawText(title, { x: 56, y: 770, size: 22, font: bold });
    page.drawText(`Beispieldokument der Demo, Seite ${i} von ${pages}`, { x: 56, y: 742, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    for (let k = 1; k <= 4; k++) {
      page.drawText(`Aufgabe ${(i - 1) * 4 + k}`, { x: 56, y: 700 - (k - 1) * 150, size: 14, font: bold });
      page.drawText('Berechnen Sie Strom, Spannung und Leistung im gezeigten Netzwerk.', { x: 56, y: 680 - (k - 1) * 150, size: 11, font });
    }
  }
  return pdf.save();
}

function seed() {
  const programs: Program[] = [
    { id: 'EIT', name: 'Elektrotechnik und Informationstechnik', sort_order: 1, active: true },
    { id: 'SYT', name: 'Systemtechnik', sort_order: 2, active: true },
  ];
  const modules: Module[] = [
    { id: 'ENG', name: 'Englisch', active: true },
    { id: 'ETG1', name: 'Grundlagen der Elektrotechnik 1', active: true },
    { id: 'ETG2', name: 'Grundlagen der Elektrotechnik 2', active: true },
    { id: 'LEL', name: 'Effiziente Leistungselektronik', active: true },
    { id: 'MAT1', name: 'Mathematik 1', active: true },
    { id: 'PHY1', name: 'Physik 1', active: true },
  ];
  const links: ProgramModule[] = [
    { program_id: 'EIT', module_id: 'ETG1', semester: 1 }, { program_id: 'EIT', module_id: 'MAT1', semester: 1 },
    { program_id: 'EIT', module_id: 'PHY1', semester: 1 }, { program_id: 'EIT', module_id: 'ETG2', semester: 2 },
    { program_id: 'EIT', module_id: 'LEL', semester: 5 }, { program_id: 'EIT', module_id: 'ENG', semester: null },
    { program_id: 'SYT', module_id: 'MAT1', semester: 1 }, { program_id: 'SYT', module_id: 'ETG1', semester: 3 },
  ];
  let n = 0;
  const doc = (f: Partial<DocFields> & Pick<DocFields, 'title' | 'doc_type' | 'module_id' | 'year' | 'author'>, extra: Partial<Doc> = {}): Doc => {
    const id = `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
    return {
      id, solution_of: null, solution_kind: null, includes_solution: false, term: 'HS', provenance: 'studierende',
      alumni_year: null, old_plan_module: null, description: '', page_count: 2, size_bytes: 24_000, status: 'approved',
      reviewed_at: '2026-02-20T10:00:00Z', created_at: '2026-02-18T10:00:00Z', uploaded_by: 'u-lea',
      uploader_email: 'lea@students.example.ch', original_path: `u-lea/${id}.pdf`, public_path: `${id}.pdf`, review_note: '',
      open_reports: 0, sha256: id.replace(/-/g, '').padEnd(64, '0'), original: null, published: null, ...f, ...extra,
    };
  };
  const exam = doc({ title: 'Prüfung HS24', doc_type: 'pruefung', module_id: 'ETG1', year: 2024, author: 'Prof. A. Beispiel' }, { page_count: 3 });
  const probe = doc({ title: 'Probeprüfung HS24', doc_type: 'probepruefung', module_id: 'ETG1', year: 2024, author: 'Prof. A. Beispiel' });
  const docs: Doc[] = [
    exam,
    doc({ title: 'Lösung zu Prüfung HS24', doc_type: 'loesung', module_id: 'ETG1', year: 2024, author: 'Prof. A. Beispiel',
      solution_of: exam.id, solution_kind: 'offiziell' }),
    probe,
    doc({ title: 'Prüfung FS23', doc_type: 'pruefung', module_id: 'ETG1', year: 2023, term: 'FS', author: 'Prof. B. Muster',
      includes_solution: true, provenance: 'alumni', alumni_year: 2024, old_plan_module: 'ET1 Elektrotechnik 1' }),
    doc({ title: 'Formelsammlung ETG1', doc_type: 'formelsammlung', module_id: 'ETG1', year: 2025, term: 'FS', author: 'L. Muster',
      description: 'Zwei Seiten, wie an der Prüfung erlaubt.' }),
    doc({ title: 'Formelsammlung Analysis', doc_type: 'formelsammlung', module_id: 'MAT1', year: 2024, author: 'T. Beispiel' }),
    doc({ title: 'Prüfung HS23', doc_type: 'pruefung', module_id: 'MAT1', year: 2023, author: 'Dr. C. Muster' },
      { status: 'pending', reviewed_at: null, public_path: null, uploader_email: 'noah@students.example.ch', uploaded_by: 'u-noah' }),
  ];
  const ratings = new Map<string, Map<string, number>>([
    [probe.id, new Map([['r1', -2], ['r2', -1], ['r3', -1], ['r4', -2], ['r5', 0]])],
  ]);
  const reports: Report[] = [{
    id: 'report-1', document_id: docs[4]!.id, reason: 'qualitaet', message: 'Seite 2 ist abgeschnitten.', created_at: '2026-03-01T09:00:00Z',
    title: docs[4]!.title, module_id: 'ETG1', doc_type: 'formelsammlung', status: 'approved', reported_by: 'u-noah', resolved: false,
  }];
  const allowed: AllowedLogin[] = [{ entry: 'students.example.ch', note: 'Studierende (Demo)' }];
  return { programs, modules, links, docs, ratings, reports, allowed, profiles: new Map<string, Profile>() };
}

export function createDemoApi(): VaultApi {
  const st = seed();
  let current: Session | null = null;
  const listeners = new Set<(s: Session | null) => void>();
  const later = () => new Promise<void>((r) => setTimeout(r, 20));
  const now = () => new Date().toISOString();

  function allowedEmail(email: string) {
    const e = email.toLowerCase();
    return st.allowed.some((l) => l.entry === e || l.entry === e.split('@')[1]);
  }
  function who(): Session {
    if (!current) throw new VaultError('not_authenticated');
    return current;
  }
  const isAdmin = () => who().email === DEMO_ADMIN;
  function member() {
    const s = who();
    const p = st.profiles.get(s.userId);
    if (!p?.rules || p.blocked || !(allowedEmail(s.email) || isAdmin())) throw new VaultError('not_member');
    return s;
  }
  function moderator() {
    member();
    if (!isAdmin()) throw new VaultError('not_allowed');
  }
  function find(id: string): Doc {
    const d = st.docs.find((x) => x.id === id);
    if (!d) throw new VaultError('not_found');
    return d;
  }
  const notify = () => listeners.forEach((cb) => cb(current));
  async function originalOf(d: Doc) {
    d.original ??= await samplePdf(d.title, d.page_count);
    return d.original;
  }
  const moduleName = (id: string) => st.modules.find((m) => m.id === id)?.name ?? '';

  return {
    demo: true,

    async getSession() { await later(); return current; },
    onSessionChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async sendCode(email) {
      await later();
      if (!allowedEmail(email) && email.toLowerCase() !== DEMO_ADMIN) throw new VaultError('email_not_allowed');
    },
    async verifyCode(email, code) {
      await later();
      if (code !== DEMO_CODE) throw new VaultError('code_invalid');
      const e = email.toLowerCase();
      current = { userId: `u-${e}`, email: e };
      notify();
    },
    async signOut() { current = null; notify(); },
    async me() {
      await later();
      const s = who();
      const p = st.profiles.get(s.userId);
      const allowed = allowedEmail(s.email);
      const admin = isAdmin();
      return {
        user_id: s.userId, email: s.email, email_allowed: allowed, rules_accepted: !!p?.rules, blocked: !!p?.blocked,
        member: !!p?.rules && !p.blocked && (allowed || admin), admin, moderates: [],
      };
    },
    async acceptRules() {
      const s = who();
      if (!allowedEmail(s.email) && !isAdmin()) throw new VaultError('email_not_allowed');
      st.profiles.set(s.userId, { rules: true, blocked: false });
    },
    async loginDomains() { return st.allowed.map((l) => l.entry).filter((e) => !e.includes('@')); },

    async plan() {
      await later();
      return {
        programs: [...st.programs].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
        modules: [...st.modules], links: [...st.links],
      };
    },
    async createProgram(p) {
      moderator();
      if (st.programs.some((x) => x.id.toLowerCase() === p.id.toLowerCase())) throw new VaultError('duplicate_id');
      st.programs.push({ ...p });
    },
    async updateProgram(oldId, p) {
      moderator();
      const x = st.programs.find((y) => y.id === oldId);
      if (!x) throw new VaultError('not_allowed');
      st.links.forEach((l) => { if (l.program_id === oldId) l.program_id = p.id; });
      Object.assign(x, p);
    },
    async deleteProgram(id) {
      moderator();
      st.programs = st.programs.filter((x) => x.id !== id);
      st.links = st.links.filter((l) => l.program_id !== id);
    },
    async createModule(m) {
      moderator();
      if (st.modules.some((x) => x.id.toLowerCase() === m.id.toLowerCase())) throw new VaultError('duplicate_id');
      st.modules.push({ ...m });
    },
    async updateModule(oldId, m) {
      moderator();
      const x = st.modules.find((y) => y.id === oldId);
      if (!x) throw new VaultError('not_allowed');
      if (m.id !== oldId) {
        st.links.forEach((l) => { if (l.module_id === oldId) l.module_id = m.id; });
        st.docs.forEach((d) => { if (d.module_id === oldId) d.module_id = m.id; });
      }
      Object.assign(x, m);
    },
    async deleteModule(id) {
      moderator();
      if (st.docs.some((d) => d.module_id === id)) throw new VaultError('in_use');
      st.modules = st.modules.filter((m) => m.id !== id);
      st.links = st.links.filter((l) => l.module_id !== id);
    },
    async linkModule(link) {
      moderator();
      const x = st.links.find((l) => l.program_id === link.program_id && l.module_id === link.module_id);
      if (x) x.semester = link.semester; else st.links.push({ ...link });
    },
    async unlinkModule(programId, moduleId) {
      moderator();
      st.links = st.links.filter((l) => !(l.program_id === programId && l.module_id === moduleId));
    },
    async allowedLogins() { moderator(); return [...st.allowed]; },
    async addAllowedLogin(entry, note) { moderator(); st.allowed.push({ entry: entry.toLowerCase(), note }); },
    async removeAllowedLogin(entry) { moderator(); st.allowed = st.allowed.filter((l) => l.entry !== entry); },

    async listDocuments(moduleId) {
      await later();
      member();
      return st.docs.filter((d) => d.status === 'approved' && (!moduleId || d.module_id === moduleId)).map(meta);
    },
    async getDocument(id) {
      await later();
      const s = member();
      const d = st.docs.find((x) => x.id === id);
      return d && (d.status === 'approved' || d.uploaded_by === s.userId || isAdmin()) ? meta(d) : null;
    },
    async upload(u) {
      await later();
      const s = member();
      if (st.docs.some((d) => d.sha256 === u.sha256 && d.status !== 'rejected')) throw new VaultError('duplicate_file');
      const f = { ...u.fields };
      if (f.solution_of) {
        const exam = st.docs.find((d) => d.id === f.solution_of && d.status === 'approved');
        if (!exam) throw new VaultError('solution_of_invalid');
        f.module_id = exam.module_id;
      }
      const id = crypto.randomUUID();
      st.docs.push({
        ...f, title: f.title.trim(), author: f.author.trim(), id, page_count: u.pageCount, size_bytes: u.file.byteLength,
        status: 'pending', reviewed_at: null, created_at: now(), uploaded_by: s.userId, uploader_email: s.email,
        original_path: `${s.userId}/${id}.pdf`, public_path: null, review_note: '', open_reports: 0, sha256: u.sha256,
        original: u.file.slice(), published: null,
      });
      return id;
    },
    async myUploads(): Promise<MyUpload[]> {
      await later();
      const s = who();
      return st.docs.filter((d) => d.uploaded_by === s.userId).reverse().map((d) => ({
        id: d.id, title: d.title, doc_type: d.doc_type, module_id: d.module_id, status: d.status, review_note: d.review_note,
        created_at: d.created_at, reviewed_at: d.reviewed_at, original_path: d.original_path,
      }));
    },
    async withdraw(u) {
      const s = who();
      const d = find(u.id);
      if (d.uploaded_by !== s.userId || d.status !== 'pending') throw new VaultError('not_allowed');
      st.docs = st.docs.filter((x) => x.id !== u.id);
    },
    async fetchDocument(id) {
      await later();
      member();
      const d = find(id);
      if (d.status !== 'approved') throw new VaultError('not_found');
      d.published ??= await watermark(await originalOf(d), {
        footer: footerText(d, moduleName(d.module_id)), title: d.title, author: d.author, subject: d.module_id, keywords: ['Study Hub'],
      });
      return d.published.slice();
    },
    async report(id, reason: ReportReason, message) {
      const s = member();
      const d = find(id);
      st.reports = st.reports.filter((r) => !(r.document_id === id && r.reported_by === s.userId && !r.resolved));
      st.reports.push({
        id: crypto.randomUUID(), document_id: id, reason, message, created_at: now(), title: d.title, module_id: d.module_id,
        doc_type: d.doc_type, status: d.status, reported_by: s.userId, resolved: false,
      });
    },
    async rate(id, value) {
      const s = member();
      if (find(id).doc_type !== 'probepruefung') throw new VaultError('not_found');
      const map = st.ratings.get(id) ?? new Map<string, number>();
      if (value === null) map.delete(s.userId); else map.set(s.userId, value);
      st.ratings.set(id, map);
    },
    async ratings(moduleId) {
      await later();
      const s = member();
      return st.docs.filter((d) => d.module_id === moduleId && d.status === 'approved' && d.doc_type === 'probepruefung').map((d) => {
        const map = st.ratings.get(d.id) ?? new Map<string, number>();
        const counts = [0, 0, 0, 0, 0];
        for (const v of map.values()) counts[v + 2]!++;
        return { document_id: d.id, counts, mine: map.get(s.userId) ?? null };
      });
    },

    async moderationQueue(status) {
      await later();
      moderator();
      return st.docs.filter((d) => d.status === status)
        .map((d) => modDoc(d, st.reports.filter((r) => r.document_id === d.id && !r.resolved).length));
    },
    async moderationReports() {
      await later();
      moderator();
      return st.reports.filter((r) => !r.resolved).map((r) => ({ ...r, status: find(r.document_id).status }));
    },
    async fetchOriginal(doc) { moderator(); return (await originalOf(find(doc.id))).slice(); },
    async updateDocument(id, fields) {
      moderator();
      Object.assign(find(id), fields);
    },
    async publish(id, watermarked) {
      await later();
      moderator();
      const d = find(id);
      Object.assign(d, { published: watermarked.slice(), status: 'approved', public_path: `${id}.pdf`, reviewed_at: now(), review_note: '' });
    },
    async reject(id, note) {
      moderator();
      if (!note.trim()) throw new VaultError('note_required');
      Object.assign(find(id), { status: 'rejected', review_note: note, reviewed_at: now(), original: null });
    },
    async remove(id, note) {
      moderator();
      if (!note.trim()) throw new VaultError('note_required');
      for (const d of st.docs.filter((x) => x.id === id || x.solution_of === id)) {
        Object.assign(d, { status: 'removed', review_note: note, reviewed_at: now(), published: null });
      }
      st.reports.forEach((r) => { if (r.document_id === id) r.resolved = true; });
    },
    async resolveReport(id) {
      moderator();
      const r = st.reports.find((x) => x.id === id);
      if (r) r.resolved = true;
    },
  };
}

