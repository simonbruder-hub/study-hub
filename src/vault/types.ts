/** Typen der Ablage, Spalten wie in supabase/schema.sql */

export type DocType = 'pruefung' | 'probepruefung' | 'formelsammlung' | 'loesung';
export type DocStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type Term = 'HS' | 'FS';
export type Provenance = 'studierende' | 'alumni';
export type SolutionKind = 'offiziell' | 'studierende';
export type ReportReason = 'urheberrecht' | 'unterrichtsunterlage' | 'falsche-angaben' | 'qualitaet' | 'anderes';
export type AccessAction = 'view' | 'download';

export const DOC_TYPES: DocType[] = ['pruefung', 'probepruefung', 'formelsammlung', 'loesung'];
export const EXAM_TYPES: DocType[] = ['pruefung', 'probepruefung'];

export interface Program { id: string; name: string; sort_order: number; active: boolean }
export interface Module { id: string; name: string; active: boolean }
/** Modul im Studiengang; semester null heisst frei wählbar */
export interface ProgramModule { program_id: string; module_id: string; semester: number | null }
export interface Plan { programs: Program[]; modules: Module[]; links: ProgramModule[] }

/** Angaben beim Hochladen, die auch die Moderation korrigieren kann */
export interface DocFields {
  title: string;
  doc_type: DocType;
  module_id: string;
  solution_of: string | null;
  solution_kind: SolutionKind | null;
  includes_solution: boolean;
  year: number;
  term: Term | null;
  author: string;
  provenance: Provenance;
  alumni_year: number | null;
  old_plan_module: string | null;
  description: string;
}

/** Was Mitglieder von einem Dokument sehen (ohne Absender) */
export interface DocMeta extends DocFields {
  id: string;
  page_count: number;
  size_bytes: number;
  status: DocStatus;
  reviewed_at: string | null;
  created_at: string;
}

/** Spalten für select; nie select=*, denn einige Spalten sind gesperrt */
export const DOC_COLUMNS = 'id,title,doc_type,module_id,solution_of,solution_kind,includes_solution,year,term,author,'
  + 'provenance,alumni_year,old_plan_module,description,page_count,size_bytes,status,reviewed_at,created_at';

/** Für die Moderation: dazu Absender, Pfade und Notiz */
export interface ModDoc extends DocMeta {
  uploader_email: string;
  open_reports: number;
  original_path: string;
  public_path: string | null;
  review_note: string;
}

export interface MyUpload {
  id: string;
  title: string;
  doc_type: DocType;
  module_id: string;
  status: DocStatus;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
  original_path: string;
}

export interface OpenReport {
  id: string;
  document_id: string;
  reason: ReportReason;
  message: string;
  created_at: string;
  title: string;
  module_id: string;
  doc_type: DocType;
  status: DocStatus;
}

/** counts[0] zählt «viel leichter» (-2), counts[4] «viel schwerer» (+2) */
export interface RatingSummary { document_id: string; counts: number[]; mine: number | null }

export interface Me {
  user_id: string;
  email: string;
  email_allowed: boolean;
  rules_accepted: boolean;
  blocked: boolean;
  member: boolean;
  admin: boolean;
  moderates: string[];
}

export interface Session { userId: string; email: string }
export interface AllowedLogin { entry: string; note: string }

export interface NewUpload { fields: DocFields; file: Uint8Array; pageCount: number; sha256: string }
