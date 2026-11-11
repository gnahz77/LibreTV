import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleLiveStreamRequest, handleProxyRequest } from './proxy-handlers';

const original = process.env.DISABLE_SERVER_PROXY;
const originalPassword = process.env.PASSWORD;
const fetchSpy = vi.fn();

afterEach(() => {
  if (original === undefined) delete process.env.DISABLE_SERVER_PROXY;
  else process.env.DISABLE_SERVER_PROXY = original;
  if (originalPassword === undefined) delete process.env.PASSWORD;
  else process.env.PASSWORD = originalPassword;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('server proxy kill switch', () => {
  it('DISABLE_SERVER_PROXY=1 时 /api/proxy 直接 403，且不校验登录/不访问上游', async () => {
    process.env.DISABLE_SERVER_PROXY = '1';
    process.env.PASSWORD = 'test-password';
    vi.stubGlobal('fetch', fetchSpy);

    const res = await handleProxyRequest(
      new Request('https://local.test/api/proxy?url=https%3A%2F%2Fcdn.example.com%2Fa.jpg'),
      'https://cdn.example.com/a.jpg'
    );

    expect(res.status).toBe(403);
    expect(await res.text()).toContain('禁用');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('DISABLE_SERVER_PROXY=1 时 /api/live/stream 直接 403，且不校验登录/不访问上游', async () => {
    process.env.DISABLE_SERVER_PROXY = 'true';
    process.env.PASSWORD = 'test-password';
    vi.stubGlobal('fetch', fetchSpy);

    const res = await handleLiveStreamRequest(
      new Request('https://local.test/api/live/stream?url=https%3A%2F%2Fcdn.example.com%2Flive.m3u8'),
      'https://cdn.example.com/live.m3u8'
    );

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: '服务器已禁用媒体代理' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
