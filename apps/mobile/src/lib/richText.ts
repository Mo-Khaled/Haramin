import { decodeEntities } from './html';

/** A run of text sharing one style inside a paragraph, heading or list item. */
export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type RichBlock =
  | { kind: 'heading'; runs: TextRun[] }
  | { kind: 'paragraph'; runs: TextRun[] }
  | { kind: 'list'; ordered: boolean; items: TextRun[][] };

const TOKEN = /<(\/?)([a-z0-9]+)[^>]*>|([^<]+)/gi;
const BOLD_TAGS = new Set(['strong', 'b']);
const ITALIC_TAGS = new Set(['em', 'i']);
const TEXT_BLOCK_TAGS = new Set(['p', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Some store pages were pasted with a broken encoding, so dashes and apostrophes arrive as U+FFFD.
 * Between two letters it was an apostrophe ("don�t"); anywhere else a dash ("2�5", "Confirmed � You").
 */
export function repairMojibake(text: string): string {
  return text.replace(/(\p{L})�(\p{L})/gu, '$1’$2').replace(/�/g, '–');
}

function cleanRuns(runs: TextRun[]): TextRun[] {
  const merged: TextRun[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.bold === run.bold && last.italic === run.italic) last.text += run.text;
    else merged.push({ ...run });
  }
  if (merged[0]) merged[0].text = merged[0].text.trimStart();
  const end = merged[merged.length - 1];
  if (end) end.text = end.text.trimEnd();
  return merged.filter((run) => run.text.length > 0);
}

/** Incremental builder fed by the tokenizer; keeps parse state out of the tokenizing loop. */
class BlockBuilder {
  readonly blocks: RichBlock[] = [];
  private runs: TextRun[] = [];
  private kind: 'heading' | 'paragraph' = 'paragraph';
  private list: { ordered: boolean; items: TextRun[][] } | null = null;
  private bold = 0;
  private italic = 0;
  private skipping = false;

  open(tag: string): void {
    if (tag === 'h1') this.skipping = true; // The screen already shows the title.
    else if (tag === 'ul' || tag === 'ol') this.list = { ordered: tag === 'ol', items: [] };
    else if (tag === 'li' || TEXT_BLOCK_TAGS.has(tag)) this.startBlock(tag.startsWith('h') ? 'heading' : 'paragraph');
    else if (tag === 'br') this.text('\n');
    else this.style(tag, 1);
  }

  close(tag: string): void {
    if (tag === 'h1') this.skipping = false;
    else if (tag === 'li') this.endListItem();
    else if (tag === 'ul' || tag === 'ol') this.endList();
    else if (TEXT_BLOCK_TAGS.has(tag)) this.endBlock();
    else this.style(tag, -1);
  }

  text(raw: string): void {
    if (this.skipping) return;
    const text = raw === '\n' ? raw : raw.replace(/\s+/g, ' ');
    this.runs.push({ text, bold: this.bold > 0, italic: this.italic > 0 });
  }

  finish(): RichBlock[] {
    this.endBlock();
    this.endList();
    return this.blocks;
  }

  private style(tag: string, delta: number): void {
    if (BOLD_TAGS.has(tag)) this.bold = Math.max(0, this.bold + delta);
    if (ITALIC_TAGS.has(tag)) this.italic = Math.max(0, this.italic + delta);
  }

  private startBlock(kind: 'heading' | 'paragraph'): void {
    if (!this.list) this.endBlock();
    this.kind = kind;
  }

  private endBlock(): void {
    const runs = cleanRuns(this.runs);
    this.runs = [];
    if (runs.length) this.blocks.push({ kind: this.kind, runs });
    this.kind = 'paragraph';
  }

  private endListItem(): void {
    const runs = cleanRuns(this.runs);
    this.runs = [];
    if (runs.length && this.list) this.list.items.push(runs);
  }

  private endList(): void {
    if (this.list?.items.length) this.blocks.push({ kind: 'list', ...this.list });
    this.list = null;
  }
}

export interface RichSection {
  title: string;
  blocks: RichBlock[];
}

/** Splits parsed content at its headings: text before the first heading is the intro, each heading opens a section. */
export function splitSections(blocks: RichBlock[]): { intro: RichBlock[]; sections: RichSection[] } {
  const intro: RichBlock[] = [];
  const sections: RichSection[] = [];
  for (const block of blocks) {
    if (block.kind === 'heading') sections.push({ title: block.runs.map((run) => run.text).join(''), blocks: [] });
    else (sections[sections.length - 1]?.blocks ?? intro).push(block);
  }
  return { intro, sections };
}

/** Parses the small HTML subset Shopify pages and policies use into blocks a native screen can lay out. */
export function parseRichText(html: string): RichBlock[] {
  const builder = new BlockBuilder();
  for (const [, closing, tag, text] of html.matchAll(TOKEN)) {
    if (text !== undefined) builder.text(repairMojibake(decodeEntities(text)));
    else if (closing) builder.close(tag!.toLowerCase());
    else builder.open(tag!.toLowerCase());
  }
  return builder.finish();
}
