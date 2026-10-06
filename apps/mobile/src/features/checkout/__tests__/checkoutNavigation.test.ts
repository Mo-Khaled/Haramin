import { describe, expect, it } from 'vitest';

import { classifyCheckoutUrl } from '../checkoutNavigation';

const SHOP = 'haramaineg.com';
const classify = (url: string) => classifyCheckoutUrl(url, SHOP);

describe('classifyCheckoutUrl', () => {
  it('allows the cart permalink and checkout pages on the store domain', () => {
    expect(classify('https://haramaineg.com/cart/c/abc123?key=xyz')).toBe('allow');
    expect(classify('https://haramaineg.com/checkouts/cn/hWN123/information')).toBe('allow');
    expect(classify('https://www.haramaineg.com/59682848873/checkouts/abc')).toBe('allow');
    expect(classify('https://b970ef-9d.myshopify.com/checkouts/cn/abc')).toBe('allow');
  });

  it('completes on thank-you and order-status pages', () => {
    expect(classify('https://haramaineg.com/checkouts/cn/abc/thank_you')).toBe('complete');
    expect(classify('https://haramaineg.com/checkouts/cn/abc/thank-you')).toBe('complete');
    expect(classify('https://shopify.com/59682848873/account/orders/a1b2c3')).toBe('complete');
  });

  it('exits when checkout tries to open a storefront page', () => {
    expect(classify('https://haramaineg.com/')).toBe('exit');
    expect(classify('https://haramaineg.com')).toBe('exit');
    expect(classify('https://haramaineg.com/cart')).toBe('exit');
    expect(classify('https://www.haramaineg.com/products/oud')).toBe('exit');
    expect(classify('https://haramaineg.com/collections/for-her')).toBe('exit');
    expect(classify('https://haramaineg.com/pages/contact')).toBe('exit');
  });

  it('allows Shopify platform and external payment pages', () => {
    expect(classify('https://shop.app/pay/session')).toBe('allow');
    expect(classify('https://checkout.pci.shopifyinc.com/build/abc')).toBe('allow');
    expect(classify('https://3ds.bank.example/challenge')).toBe('allow');
    expect(classify('about:blank')).toBe('allow');
  });

  it('does not let a third-party page complete the checkout or downgrade to plain HTTP', () => {
    expect(classify('https://3ds.bank.example/thank_you')).toBe('allow');
    expect(classify('https://evil.example/orders/abc123')).toBe('allow');
    expect(classify('http://3ds.bank.example/challenge')).toBe('exit');
    expect(classify('http://haramaineg.com/checkouts/cn/abc')).toBe('exit');
  });

  it('exits on non-web schemes and malformed URLs', () => {
    expect(classify('intent://scan#Intent;end')).toBe('exit');
    expect(classify('javascript:alert(1)')).toBe('exit');
    expect(classify('not a url')).toBe('exit');
  });
});
