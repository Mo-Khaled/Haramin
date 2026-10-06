/** Query parameters whose values must never reach the logs (webhook secret, OAuth code/state). */
const SENSITIVE_PARAMS = new Set(['secret', 'code', 'state', 'api_token', 'token']);

/** Decodes a query key, falling back to the raw text: malformed percent-encoding must never throw inside the logger. */
function decodeKey(key: string): string {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

/** Replaces sensitive query-string values in a request URL with "[redacted]". */
export function redactUrl(url: string): string {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return url;
  const query = url
    .slice(queryStart + 1)
    .split('&')
    .map((pair) => {
      const separator = pair.indexOf('=');
      const key = separator === -1 ? pair : pair.slice(0, separator);
      return SENSITIVE_PARAMS.has(decodeKey(key).toLowerCase()) ? `${key}=[redacted]` : pair;
    })
    .join('&');
  return `${url.slice(0, queryStart)}?${query}`;
}
