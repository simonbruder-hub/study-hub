/** Schreibregeln für alles im Repo (die Inhalte prüft zusätzlich npm run inhalt): kein scharfes S, keine Gedankenstriche */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const DIRS = ['src', 'web', 'docs', 'supabase', 'scripts', 'tests', '.github', 'inhalt', 'schema'];
const FILES = ['README.md', 'CLAUDE.md', 'package.json', 'vite.config.ts', 'playwright.config.ts', '.gitignore', '.editorconfig'];
const TEXT = /\.(md|ts|tsx|mjs|js|json|sql|sh|ya?ml|css|html|svg)$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : TEXT.test(name) ? [path] : [];
  });
}

describe('Schreibregeln', () => {
  it('kein scharfes S und keine Gedankenstriche', () => {
    const files = [...DIRS.flatMap((d) => walk(join(root, d))), ...FILES.map((f) => join(root, f))];
    const found: string[] = [];
    for (const file of files) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (/[\u00df\u2013\u2014]/.test(line)) found.push(`${relative(root, file)}:${i + 1}`);
      });
    }
    expect(files.length).toBeGreaterThan(30);
    expect(found).toEqual([]);
  });
});
