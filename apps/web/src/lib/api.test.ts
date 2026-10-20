import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repo } from '../mocks/repository';
import { api } from './api';

describe('demo transport', () => {
  beforeEach(() => repo.reset());
  afterEach(() => vi.unstubAllGlobals());
  it('loads workspace even when network requests would return HTML', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }),
      );
    vi.stubGlobal('fetch', fetch);
    const workspace = await api<{ profile: { business: string } }>('/workspace');
    expect(workspace.profile.business).toBe('Ada Atelier');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('creates and retrieves a payment link without a service worker', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const input = {
      title: 'Test order',
      customer: 'Demo customer',
      currency: 'NGN',
      amount: '6000',
      email: '',
      expires: '30',
    };
    const link = await api<{ id: string }>('/payment-links', input, 'POST', 'demo-link-test');
    expect(await api('/payment-links', input, 'POST', 'demo-link-test')).toMatchObject({
      id: link.id,
    });
    expect(await api(`/payment-links/${link.id}`)).toMatchObject({
      id: link.id,
      title: 'Test order',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('reports unsupported demo routes rather than falling through to HTML', async () => {
    await expect(api('/unknown')).rejects.toThrow('Demo action is not supported');
  });
});
