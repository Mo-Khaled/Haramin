import { describe, expect, it } from 'vitest';

import { redactUrl } from '../lib/redact.js';

describe('redactUrl', () => {
  it('hides webhook secrets and OAuth codes but keeps other parameters', () => {
    expect(redactUrl('/webhooks/bosta?secret=abc123')).toBe('/webhooks/bosta?secret=[redacted]');
    expect(redactUrl('/auth/callback?code=xyz&state=s1&lang=ar')).toBe('/auth/callback?code=[redacted]&state=[redacted]&lang=ar');
  });

  it('leaves URLs without sensitive parameters untouched', () => {
    expect(redactUrl('/reviews/cream-velvet-100ml')).toBe('/reviews/cream-velvet-100ml');
    expect(redactUrl('/health?verbose=1')).toBe('/health?verbose=1');
  });

  it('matches parameter names case-insensitively, including bare flags', () => {
    expect(redactUrl('/x?SECRET=1&token')).toBe('/x?SECRET=[redacted]&token=[redacted]');
  });

  it('never throws on malformed percent-encoding and still redacts what it can read', () => {
    expect(() => redactUrl('/health?%')).not.toThrow();
    expect(redactUrl('/x?a=1&%zz=2&secret=s')).toBe('/x?a=1&%zz=2&secret=[redacted]');
  });
});
