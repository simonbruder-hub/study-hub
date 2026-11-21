/** Typen zu scripts/inhalt.mjs, damit vite.config.ts die Prüfung als Plugin nutzen kann */
import type { Inhalt } from '../src/data/types';

export interface Problem { file: string; line?: number; msg: string }
export const SECTIONS: string[];
export function readContent(dir?: string): Map<string, string | null>;
export function splitFrontMatter(text: string): { head: string; body: string } | null;
export function checkContent(files: Map<string, string | null>): { errors: Problem[]; warnings: Problem[]; data: Inhalt };
export function formatProblem(p: Problem): string;
