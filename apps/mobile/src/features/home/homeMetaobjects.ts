/**
 * Turns Shopify metaobject entries (edited by staff in Admin → Content → Metaobjects) into home
 * content. Entries with missing or invalid fields are skipped rather than shown half-broken.
 */

export interface MetaobjectField {
  key: string;
  value: string | null;
  reference?: { image?: { url: string } | null } | null;
}

export interface MetaobjectNode {
  id: string;
  fields: MetaobjectField[];
}

export type BannerTarget = { collection: string } | { route: '/stores' };

export interface Banner {
  id: string;
  image: string;
  target: BannerTarget;
  label: string;
  position: number;
}

export interface PromoContent {
  code: string;
  message: string;
}

function fieldMap(node: MetaobjectNode): Map<string, MetaobjectField> {
  return new Map(node.fields.map((f) => [f.key, f]));
}

function parseTarget(type: string | null | undefined, handle: string | null | undefined): BannerTarget | null {
  if (type === 'stores') return { route: '/stores' };
  if (type === 'collection' && handle && /^[a-z0-9-]+$/.test(handle)) return { collection: handle };
  return null;
}

/** app_banner fields: image (file), link_type ("collection" | "stores"), link_handle, label, position. */
export function parseBanners(nodes: MetaobjectNode[]): Banner[] {
  return nodes
    .flatMap((node) => {
      const fields = fieldMap(node);
      const image = fields.get('image')?.reference?.image?.url;
      const target = parseTarget(fields.get('link_type')?.value, fields.get('link_handle')?.value);
      if (!image || !target) return [];
      const position = Number(fields.get('position')?.value ?? '0');
      return [
        {
          id: node.id,
          image,
          target,
          label: fields.get('label')?.value?.trim() ?? '',
          position: Number.isFinite(position) ? position : 0,
        },
      ];
    })
    .sort((a, b) => a.position - b.position);
}

/** app_promo fields: code, message, active ("true"/"false"). The first active entry wins. */
export function parsePromo(nodes: MetaobjectNode[]): PromoContent | null {
  for (const node of nodes) {
    const fields = fieldMap(node);
    const code = fields.get('code')?.value?.trim();
    const message = fields.get('message')?.value?.trim();
    if (fields.get('active')?.value === 'true' && code && message) return { code, message };
  }
  return null;
}
