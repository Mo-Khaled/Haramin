export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Finds the brand collection for a product vendor. Vendors are stored as names ("KHADLAJ") while
 * brand collections often carry a suffix ("khadlaj-perfumes"), so an exact or prefix match is used.
 */
export function findBrandHandle(vendor: string, brandHandles: string[]): string | null {
  const slug = slugify(vendor);
  if (!slug) return null;
  return brandHandles.find((handle) => handle === slug) ?? brandHandles.find((handle) => handle.startsWith(`${slug}-`)) ?? null;
}
