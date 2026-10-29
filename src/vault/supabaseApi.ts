/** Ablage auf Supabase: Tabellen, Funktionen und Speicher aus supabase/schema.sql */
import {
  createClient, isAuthError, isAuthRetryableFetchError, type Session as SbSession,
} from '@supabase/supabase-js';
import { VaultError, type VaultApi } from './api';
import {
  DOC_COLUMNS, type DocMeta, type ModDoc, type MyUpload, type OpenReport, type Plan, type RatingSummary,
} from './types';

/** Fehlerschlüssel, die die Funktionen der Datenbank als message werfen */
const DB_CODES = new Set([
  'not_authenticated', 'email_not_allowed', 'not_member', 'not_allowed', 'not_found', 'invalid_state',
  'missing_file', 'note_required', 'rate_limit', 'solution_of_invalid', 'has_solutions', 'invalid_action',
]);

interface DbError { code?: string; message?: string }

export function dbError(e: DbError): VaultError {
  const msg = e.message ?? '';
  if (DB_CODES.has(msg)) return new VaultError(msg, msg, { cause: e });
  switch (e.code) {
    case '23505': return new VaultError(msg.includes('sha256') ? 'duplicate_file' : 'duplicate_id', msg, { cause: e });
    case '23503': return new VaultError('in_use', msg, { cause: e });
    case '23514': return new VaultError('invalid_value', msg, { cause: e });
    case '42501': return new VaultError('not_allowed', msg, { cause: e });
  }
  if (!e.code || /fetch|network/i.test(msg)) return new VaultError('network', msg, { cause: e });
  return new VaultError('unknown', msg, { cause: e });
}

export function storageError(e: unknown): VaultError {
  const err = (e ?? {}) as { statusCode?: string | number; status?: number; message?: string };
  const status = Number(err.statusCode ?? err.status ?? 0);
  const msg = err.message ?? '';
  if (status === 413 || /exceed|too large/i.test(msg)) return new VaultError('too_large', msg, { cause: e });
  if (/mime/i.test(msg)) return new VaultError('not_pdf', msg, { cause: e });
  if (status === 401 || status === 403 || /row-level security|unauthori[sz]ed/i.test(msg)) return new VaultError('not_allowed', msg, { cause: e });
  if (status === 404 || /not found/i.test(msg)) return new VaultError('not_found', msg, { cause: e });
  if (/fetch|network/i.test(msg)) return new VaultError('network', msg, { cause: e });
  return new VaultError('unknown', msg, { cause: e });
}

function authError(e: unknown, context: 'send' | 'verify'): VaultError {
  if (isAuthRetryableFetchError(e)) return new VaultError('network', e.message, { cause: e });
  if (isAuthError(e)) {
    if (e.status === 429) return new VaultError('too_many_requests', e.message, { cause: e });
    if (context === 'verify') return new VaultError('code_invalid', e.message, { cause: e });
    if (e.status === 403 || e.status === 422 || e.code === 'signup_disabled') {
      return new VaultError('email_not_allowed', e.message, { cause: e });
    }
    return new VaultError('unknown', e.message, { cause: e });
  }
  return new VaultError('network', String(e), { cause: e });
}

const toSession = (s: SbSession | null) => (s ? { userId: s.user.id, email: s.user.email ?? '' } : null);
const pdfBlob = (bytes: Uint8Array) => new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });

export function createSupabaseApi(url: string, anonKey: string): VaultApi {
  const sb = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });

  async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw dbError(error);
    return data as T;
  }
  function check<T>(res: { data: T; error: DbError | null }): T {
    if (res.error) throw dbError(res.error);
    return res.data;
  }
  /** Für update und delete: Regeln, die nicht passen, liefern 0 Zeilen statt eines Fehlers */
  function changed(res: { data: unknown[] | null; error: DbError | null }) {
    if (!check(res)?.length) throw new VaultError('not_allowed');
  }
  async function userId(): Promise<string> {
    const { data } = await sb.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new VaultError('not_authenticated');
    return id;
  }
  async function download(bucket: string, path: string): Promise<Uint8Array> {
    const { data, error } = await sb.storage.from(bucket).download(path);
    if (error) throw storageError(error);
    return new Uint8Array(await data.arrayBuffer());
  }
  async function removeFiles(bucket: string, paths: string[]) {
    if (paths.length) await sb.storage.from(bucket).remove(paths);
  }

  return {
    demo: false,

    async getSession() {
      const { data } = await sb.auth.getSession();
      return toSession(data.session);
    },
    onSessionChange(cb) {
      // Keine weiteren Aufrufe von Supabase direkt im Rückruf (Sperre in supabase-js)
      const { data } = sb.auth.onAuthStateChange((_event, s) => { setTimeout(() => cb(toSession(s)), 0); });
      return () => data.subscription.unsubscribe();
    },
    async sendCode(email) {
      const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
      if (error) throw authError(error, 'send');
    },
    async verifyCode(email, code) {
      const { data, error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (error) throw authError(error, 'verify');
      if (!data.session) throw new VaultError('code_invalid');
    },
    async signOut() {
      await sb.auth.signOut();
    },
    me: () => rpc('me'),
    acceptRules: () => rpc('accept_rules'),
    loginDomains: () => rpc('login_domains'),

    async plan(): Promise<Plan> {
      const [programs, modules, links] = await Promise.all([
        sb.from('programs').select('id,name,sort_order,active').order('sort_order').order('name'),
        sb.from('modules').select('id,name,active').order('id'),
        sb.from('program_modules').select('program_id,module_id,semester'),
      ]);
      return { programs: check(programs) ?? [], modules: check(modules) ?? [], links: check(links) ?? [] };
    },
    async createProgram(p) { check(await sb.from('programs').insert(p)); },
    async updateProgram(oldId, p) { changed(await sb.from('programs').update(p).eq('id', oldId).select('id')); },
    async deleteProgram(id) { changed(await sb.from('programs').delete().eq('id', id).select('id')); },
    async createModule(m) { check(await sb.from('modules').insert(m)); },
    async updateModule(oldId, m) { changed(await sb.from('modules').update(m).eq('id', oldId).select('id')); },
    async deleteModule(id) { changed(await sb.from('modules').delete().eq('id', id).select('id')); },
    async linkModule(link) { check(await sb.from('program_modules').upsert(link)); },
    async unlinkModule(programId, moduleId) {
      changed(await sb.from('program_modules').delete().eq('program_id', programId).eq('module_id', moduleId).select('module_id'));
    },
    async allowedLogins() { return check(await sb.from('allowed_logins').select('entry,note').order('entry')) ?? []; },
    async addAllowedLogin(entry, note) { check(await sb.from('allowed_logins').insert({ entry: entry.trim().toLowerCase(), note })); },
    async removeAllowedLogin(entry) { changed(await sb.from('allowed_logins').delete().eq('entry', entry).select('entry')); },

    async listDocuments(moduleId) {
      let q = sb.from('documents').select(DOC_COLUMNS).eq('status', 'approved');
      if (moduleId) q = q.eq('module_id', moduleId);
      return (check(await q.order('year', { ascending: false }).order('title')) ?? []) as unknown as DocMeta[];
    },
    async getDocument(id) {
      return check(await sb.from('documents').select(DOC_COLUMNS).eq('id', id).maybeSingle()) as unknown as DocMeta | null;
    },
    async upload(u) {
      const uid = await userId();
      const id = crypto.randomUUID();
      check(await sb.from('documents').insert({
        id, ...u.fields, page_count: u.pageCount, size_bytes: u.file.byteLength, sha256: u.sha256,
      }));
      const { error } = await sb.storage.from('eingang')
        .upload(`${uid}/${id}.pdf`, pdfBlob(u.file), { contentType: 'application/pdf', upsert: false });
      if (error) {
        await sb.from('documents').delete().eq('id', id);
        throw storageError(error);
      }
      return id;
    },
    myUploads: () => rpc<MyUpload[]>('my_uploads'),
    async withdraw(u) {
      await removeFiles('eingang', [u.original_path]);
      changed(await sb.from('documents').delete().eq('id', u.id).select('id'));
    },
    async fetchDocument(id, action) {
      const path = await rpc<string>('request_document', { p_id: id, p_action: action });
      return download('freigegeben', path);
    },
    async report(id, reason, message) { await rpc('report_document', { p_id: id, p_reason: reason, p_message: message }); },
    async rate(id, value) { await rpc('rate_document', { p_id: id, p_value: value }); },
    ratings: (moduleId) => rpc<RatingSummary[]>('rating_summary', { p_module: moduleId }),

    moderationQueue: (status) => rpc<ModDoc[]>('moderation_queue', { p_status: status }),
    moderationReports: () => rpc<OpenReport[]>('moderation_reports'),
    fetchOriginal: (doc) => download('eingang', doc.original_path),
    async updateDocument(id, fields) { changed(await sb.from('documents').update(fields).eq('id', id).select('id')); },
    async publish(id, watermarked) {
      const { error } = await sb.storage.from('freigegeben')
        .upload(`${id}.pdf`, pdfBlob(watermarked), { contentType: 'application/pdf', upsert: true });
      if (error) throw storageError(error);
      await rpc('approve_document', { p_id: id });
    },
    async reject(id, note) {
      const path = await rpc<string>('reject_document', { p_id: id, p_note: note });
      await removeFiles('eingang', [path]);
    },
    async remove(id, note) {
      const files = await rpc<{ bucket: string; path: string }[]>('remove_document', { p_id: id, p_note: note });
      for (const bucket of ['eingang', 'freigegeben']) {
        await removeFiles(bucket, files.filter((f) => f.bucket === bucket).map((f) => f.path));
      }
    },
    async resolveReport(id, resolution) { await rpc('resolve_report', { p_id: id, p_resolution: resolution }); },
  };
}
