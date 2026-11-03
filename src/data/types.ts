/** Daten des Formelbuchs, wie scripts/inhalt.mjs sie erzeugt: Text und Formeln schon als HTML (KaTeX) */
export type Tool = 'lernlabor' | 'python' | 'falstad' | 'plecs' | 'simulink';
export type Level = 1 | 2 | 3;

export interface Quantity { name: string; symbol: string; unit: string; symbol_html: string; unit_html: string }
export interface Variable { symbol: string; quantity: string; meaning?: string; symbol_html: string }
export interface Source { title: string; author?: string; year?: number; url?: string }
export interface Link { title: string; url: string }
export interface Simulation {
  tool: Tool;
  title?: string;
  example?: string;
  circuit?: string;
  file?: string;
  image?: string;
  result?: string;
  params?: unknown;
}
export interface LearningResources { simulations?: Simulation[]; videos?: Link[]; links?: Link[]; prompt?: string }

export interface FormulaNode {
  id: string;
  file: string;
  topic: string;
  discipline: string;
  title: string;
  level: Level;
  latex_expression: string;
  latex_html: string;
  forms: string[];
  forms_html: string[];
  variables: Variable[];
  modules: string[];
  prerequisites: string[];
  required_by: string[];
  analogies: string[];
  learning_resources: LearningResources;
  sources: Source[];
  /** Text des Knotens (MyST-Teilmenge) als HTML */
  html: string;
}

export interface Analogy { title: string; nodes: string[]; mapping: string[][]; note?: string }
export interface ModuleInfo { title: string; tools?: Tool[] }

export interface Inhalt {
  disciplines: Record<string, { title: string; topics: string[] }>;
  topics: Record<string, { title: string; discipline: string }>;
  quantities: Record<string, Quantity>;
  modules: Record<string, ModuleInfo>;
  analogies: Record<string, Analogy>;
  /** sortiert nach Thema (wie in themen.yaml), Stufe und Titel */
  nodes: Record<string, FormulaNode>;
}
