import { describe, expect, it } from 'vitest';

import { parseRichText, repairMojibake, splitSections } from '../richText';

const POLICY = `<div class="policy-page">
  <h1>Shipping Policy</h1>
  <p>Thank you for shopping with <strong>Haramain</strong>.</p>
  <h2>How We Deliver</h2>
  <ol>
    <li>
<strong>Order Confirmed</strong> � You&#39;ll receive a confirmation.</li>
    <li><strong>Out for Delivery</strong> � Our courier calls first.</li>
  </ol>
  <p><em>All sales are final</em> on opened items &amp; samples. We don�t ship 2�5 times.</p>
</div>`;

describe('parseRichText', () => {
  it('turns store HTML into headings, paragraphs and lists, dropping the duplicate h1 title', () => {
    expect(parseRichText(POLICY)).toEqual([
      { kind: 'paragraph', runs: [{ text: 'Thank you for shopping with ', bold: false, italic: false }, { text: 'Haramain', bold: true, italic: false }, { text: '.', bold: false, italic: false }] },
      { kind: 'heading', runs: [{ text: 'How We Deliver', bold: false, italic: false }] },
      {
        kind: 'list',
        ordered: true,
        items: [
          [{ text: 'Order Confirmed', bold: true, italic: false }, { text: ' – You\'ll receive a confirmation.', bold: false, italic: false }],
          [{ text: 'Out for Delivery', bold: true, italic: false }, { text: ' – Our courier calls first.', bold: false, italic: false }],
        ],
      },
      {
        kind: 'paragraph',
        runs: [
          { text: 'All sales are final', bold: false, italic: true },
          { text: ' on opened items & samples. We don’t ship 2–5 times.', bold: false, italic: false },
        ],
      },
    ]);
  });

  it('returns nothing for empty content', () => {
    expect(parseRichText('')).toEqual([]);
    expect(parseRichText('<div>  </div>')).toEqual([]);
  });
});

describe('repairMojibake', () => {
  it('restores apostrophes inside words and dashes elsewhere, including Arabic letters', () => {
    expect(repairMojibake('don�t')).toBe('don’t');
    expect(repairMojibake('2�5 days')).toBe('2–5 days');
    expect(repairMojibake('Confirmed � You')).toBe('Confirmed – You');
  });
});

describe('splitSections', () => {
  it('keeps text before the first heading as the intro and groups the rest under each heading', () => {
    const { intro, sections } = splitSections(
      parseRichText('<p>Last updated today</p><h2>Your rights</h2><p>You can ask.</p><ul><li>Access</li></ul><h2>Changes</h2><p>We may update this.</p>'),
    );
    expect(intro).toHaveLength(1);
    expect(sections.map((s) => s.title)).toEqual(['Your rights', 'Changes']);
    expect(sections[0]!.blocks.map((b) => b.kind)).toEqual(['paragraph', 'list']);
  });

  it('returns only an intro when the content has no headings', () => {
    const { intro, sections } = splitSections(parseRichText('<p>Short policy.</p>'));
    expect(intro).toHaveLength(1);
    expect(sections).toEqual([]);
  });
});
