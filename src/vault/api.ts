/**
 * Schnittstelle der Ablage zum Server. Zwei Umsetzungen:
 * - supabaseApi.ts: das echte Backend (supabase/schema.sql)
 * - demoApi.ts: Beispieldaten im Speicher des Browsers, für die Tests und zum Ausprobieren
 */
import type {
  AccessAction, AllowedLogin, DocFields, DocMeta, DocStatus, Me, ModDoc, Module, MyUpload, NewUpload,
  OpenReport, Plan, Program, ProgramModule, RatingSummary, ReportReason, Session,
} from './types';

export interface VaultApi {
  readonly demo: boolean;

  getSession(): Promise<Session | null>;
  onSessionChange(cb: (s: Session | null) => void): () => void;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  me(): Promise<Me>;
  acceptRules(): Promise<void>;
  loginDomains(): Promise<string[]>;

  plan(): Promise<Plan>;
  createProgram(p: Program): Promise<void>;
  updateProgram(oldId: string, p: Program): Promise<void>;
  deleteProgram(id: string): Promise<void>;
  createModule(m: Module): Promise<void>;
  updateModule(oldId: string, m: Module): Promise<void>;
  deleteModule(id: string): Promise<void>;
  linkModule(link: ProgramModule): Promise<void>;
  unlinkModule(programId: string, moduleId: string): Promise<void>;
  allowedLogins(): Promise<AllowedLogin[]>;
  addAllowedLogin(entry: string, note: string): Promise<void>;
  removeAllowedLogin(entry: string): Promise<void>;

  /** Freigegebene Dokumente, alle oder die eines Moduls */
  listDocuments(moduleId?: string): Promise<DocMeta[]>;
  /** Ein Dokument, auch ein eigenes offenes (null, wenn nicht sichtbar) */
  getDocument(id: string): Promise<DocMeta | null>;
  upload(u: NewUpload): Promise<string>;
  myUploads(): Promise<MyUpload[]>;
  withdraw(u: MyUpload): Promise<void>;
  /** Abruf mit Rate-Limit; liefert die Fassung mit Wasserzeichen */
  fetchDocument(id: string, action: AccessAction): Promise<Uint8Array>;
  report(id: string, reason: ReportReason, message: string): Promise<void>;
  rate(id: string, value: number | null): Promise<void>;
  ratings(moduleId: string): Promise<RatingSummary[]>;

  moderationQueue(status: DocStatus): Promise<ModDoc[]>;
  moderationReports(): Promise<OpenReport[]>;
  fetchOriginal(doc: ModDoc): Promise<Uint8Array>;
  updateDocument(id: string, fields: DocFields): Promise<void>;
  /** Fassung mit Wasserzeichen speichern und freigeben */
  publish(id: string, watermarked: Uint8Array): Promise<void>;
  reject(id: string, note: string): Promise<void>;
  remove(id: string, note: string): Promise<void>;
  resolveReport(id: string, resolution: string): Promise<void>;
}

/** Fehler mit Schlüssel; den Text dazu liefert labels.ts (errorText) */
export class VaultError extends Error {
  constructor(public readonly code: string, message?: string, options?: { cause?: unknown }) {
    super(message ?? code, options);
    this.name = 'VaultError';
  }
}

let instance: Promise<VaultApi | null> | null = null;

/** Die Verbindung, einmal pro Sitzung; null, wenn Supabase nicht eingerichtet ist */
export function getApi(): Promise<VaultApi | null> {
  instance ??= (async () => {
    if (__DEMO__) return (await import('./demoApi')).createDemoApi();
    const url = import.meta.env.VITE_SUPABASE_URL?.trim();
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
    if (!url || !key) return null;
    return (await import('./supabaseApi')).createSupabaseApi(url, key);
  })();
  return instance;
}
