import type { ScentNotes } from './types';

const NOTE_KEY = /^(top|heart|base)_notes_(\d+)$/;

/**
 * Groups the custom.<tier>_notes_<n> metafields into the scent pyramid, ordered by n. Missing metafields
 * come back as null and empty values are skipped, so a product with no notes yields three empty tiers.
 */
export function toScentNotes(fields: ({ key: string; value: string } | null)[]): ScentNotes {
  const notes: ScentNotes = { top: [], heart: [], base: [] };
  const ordered = fields
    .flatMap((field) => {
      const match = field && field.value.trim() ? NOTE_KEY.exec(field.key) : null;
      return match ? [{ tier: match[1] as keyof ScentNotes, order: Number(match[2]), value: field!.value.trim() }] : [];
    })
    .sort((a, b) => a.order - b.order);
  for (const note of ordered) notes[note.tier].push(note.value);
  return notes;
}

export function hasScentNotes(notes: ScentNotes): boolean {
  return notes.top.length + notes.heart.length + notes.base.length > 0;
}
