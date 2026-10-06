/** Query parameters whose values must never reach the logs (webhook secret, OAuth code/state). */
const SENSITIVE_PARAMS = new Set(['secret', 'code', 'state', 'api_token', 'token']);

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
      return SENSITIVE_PARAMS.has(decodeURIComponent(key).toLowerCase()) ? `${key}=[redacted]` : pair;
    })
    .join('&');
  return `${url.slice(0, queryStart)}?${query}`;
}
