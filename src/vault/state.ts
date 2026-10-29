/** Zustand der Ablage: Verbindung, Sitzung, eigenes Profil, Studienplan */
import { computed, signal } from '@preact/signals';
import { getApi, type VaultApi } from './api';
import type { Me, Plan, Program, Session } from './types';

/** undefined: lädt noch; null: Supabase nicht eingerichtet */
export const api = signal<VaultApi | null | undefined>(undefined);
export const session = signal<Session | null | undefined>(undefined);
export const me = signal<Me | null>(null);
export const meError = signal<unknown>(null);
export const plan = signal<Plan | null>(null);
/** Zähler für die Moderation (offene Uploads und Meldungen) */
export const modCount = signal(0);

export const isModerator = computed(() => !!me.value && (me.value.admin || me.value.moderates.length > 0));

let started = false;

export async function startVault() {
  if (started) return;
  started = true;
  const a = await getApi();
  api.value = a;
  if (!a) return;
  a.onSessionChange((s) => {
    if (s?.userId === session.value?.userId) return;
    session.value = s;
    void loadAccount();
  });
  session.value = await a.getSession();
  await loadAccount();
}

export async function loadAccount() {
  const a = api.value;
  me.value = null;
  meError.value = null;
  if (!a || !session.value) return;
  try {
    me.value = await a.me();
    if (me.value.member) await Promise.all([refreshPlan(), refreshModCount()]);
  } catch (e) {
    meError.value = e;
  }
}

export async function refreshPlan() {
  const a = api.value;
  if (a) plan.value = await a.plan();
}

export async function refreshModCount() {
  const a = api.value;
  if (!a || !isModerator.value) { modCount.value = 0; return; }
  const [queue, reports] = await Promise.all([a.moderationQueue('pending'), a.moderationReports()]);
  modCount.value = queue.length + reports.length;
}

/** Gewählter Studiengang, auf dem Gerät gemerkt */
const PROGRAM_KEY = 'studyhub.studiengang';
export function rememberedProgram(): string | null {
  try { return localStorage.getItem(PROGRAM_KEY); } catch { return null; }
}
export function rememberProgram(id: string) {
  try { localStorage.setItem(PROGRAM_KEY, id); } catch { /* ohne Speicher */ }
}

export function activePrograms(p: Plan | null): Program[] {
  return (p?.programs ?? []).filter((x) => x.active);
}

export function moduleName(p: Plan | null, id: string): string {
  return p?.modules.find((m) => m.id === id)?.name ?? '';
}
