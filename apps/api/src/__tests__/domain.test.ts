import { describe, expect, it } from 'vitest';

import { buildDeliveryPayload, mapBostaState, type ShopifyOrderPayload } from '../domain/bosta.js';
import { checkRedeem, pointsForSubtotal } from '../domain/loyalty.js';
import { summarizeReviews, type JudgemeReview } from '../domain/reviews.js';
import { classifyPayment } from '../domain/payment.js';
import { isPriceDrop, minVariantPrice } from '../domain/pricing.js';

describe('loyalty', () => {
  it('awards one point per 10 EGP, rounded down', () => {
    expect(pointsForSubtotal(999)).toBe(99);
    expect(pointsForSubtotal(9)).toBe(0);
    expect(pointsForSubtotal(-50)).toBe(0);
    expect(pointsForSubtotal(Number.NaN)).toBe(0);
  });

  it('only redeems multiples of 100 points that the balance covers', () => {
    expect(checkRedeem(100, 250)).toEqual({ ok: true, creditEgp: 50 });
    expect(checkRedeem(200, 250)).toEqual({ ok: true, creditEgp: 100 });
    expect(checkRedeem(150, 250)).toEqual({ ok: false, reason: 'invalid_amount' });
    expect(checkRedeem(0, 250)).toEqual({ ok: false, reason: 'invalid_amount' });
    expect(checkRedeem(300, 250)).toEqual({ ok: false, reason: 'insufficient_points' });
  });
});

describe('payment classification', () => {
  it('detects COD, InstaPay and card gateways', () => {
    expect(classifyPayment(['Cash on Delivery (COD)'])).toBe('COD');
    expect(classifyPayment(['InstaPay'])).toBe('INSTAPAY');
    expect(classifyPayment(['Shopify Payments'])).toBe('CARD');
    expect(classifyPayment(['manual'])).toBe('OTHER');
  });
});

describe('pricing', () => {
  it('finds the lowest variant price', () => {
    expect(minVariantPrice([{ price: '950.00' }, { price: '700.50' }])).toBe(700.5);
    expect(minVariantPrice([])).toBeNull();
  });

  it('flags drops of at least 5 percent only', () => {
    expect(isPriceDrop(1000, 940)).toBe(true);
    expect(isPriceDrop(1000, 960)).toBe(false);
    expect(isPriceDrop(1000, 1200)).toBe(false);
    expect(isPriceDrop(0, 10)).toBe(false);
  });
});

describe('bosta', () => {
  const order: ShopifyOrderPayload = {
    id: 1,
    name: '#1001',
    total_price: '1500.00',
    subtotal_price: '1410.00',
    total_outstanding: '1500.00',
    shipping_address: { first_name: 'Sara', last_name: 'Ali', address1: '12 Nile St', city: 'Cairo', phone: '01012345678' },
    line_items: [{ quantity: 2, title: 'Oud' }],
  };

  it('maps delivery states', () => {
    expect(mapBostaState(45)).toBe('delivered');
    expect(mapBostaState(41)).toBe('out_for_delivery');
    expect(mapBostaState(21)).toBe('picked_up');
    expect(mapBostaState(30)).toBe('in_transit');
    expect(mapBostaState(10)).toBe('created');
    expect(mapBostaState(46)).toBe('returned');
  });

  it('builds a COD payload with the outstanding amount', () => {
    const payload = buildDeliveryPayload(order, true);
    expect(payload?.cod).toBe(1500);
    expect(payload?.specs.packageDetails.itemsCount).toBe(2);
    expect(payload?.receiver.phone).toBe('01012345678');
  });

  it('sends zero COD for prepaid orders', () => {
    expect(buildDeliveryPayload(order, false)?.cod).toBe(0);
  });

  it('refuses to ship without an address or phone', () => {
    expect(buildDeliveryPayload({ ...order, shipping_address: null }, true)).toBeNull();
    expect(buildDeliveryPayload({ ...order, shipping_address: { address1: 'x', city: 'y' } }, true)).toBeNull();
  });
});

describe('summarizeReviews', () => {
  const review = (id: number, rating: number, extra: Partial<JudgemeReview> = {}): JudgemeReview => ({
    id,
    rating,
    title: null,
    body: ' Great ',
    published: true,
    hidden: false,
    created_at: `2026-0${id}-01T00:00:00Z`,
    reviewer: { name: 'Ali' },
    ...extra,
  });

  it('averages only published, visible reviews and builds the histogram', () => {
    const summary = summarizeReviews([review(1, 5), review(2, 4), review(3, 1, { hidden: true }), review(4, 2, { published: false })]);
    expect(summary.count).toBe(2);
    expect(summary.average).toBe(4.5);
    expect(summary.histogram).toEqual([1, 1, 0, 0, 0]);
  });

  it('lists newest first with trimmed text and visible pictures only', () => {
    const summary = summarizeReviews([
      review(1, 5),
      review(2, 3, { pictures: [{ urls: { compact: 'a.jpg' } }, { hidden: true, urls: { compact: 'b.jpg' } }] }),
    ]);
    expect(summary.reviews.map((r) => r.id)).toEqual([2, 1]);
    expect(summary.reviews[0]).toMatchObject({ body: 'Great', pictures: ['a.jpg'], author: 'Ali' });
  });

  it('returns zeros when there are no reviews', () => {
    expect(summarizeReviews([])).toEqual({ average: 0, count: 0, histogram: [0, 0, 0, 0, 0], reviews: [] });
  });
});
