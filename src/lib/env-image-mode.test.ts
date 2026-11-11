import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEnvImageMode, isServerProxyDisabled } from './env-image-mode';

const KEY = 'DEFAULT_IMAGE_MODE';
const original = process.env[KEY];

afterEach(() => {
  if (original === undefined) delete process.env[KEY];
  else process.env[KEY] = original;
  vi.restoreAllMocks();
});

describe('getEnvImageMode', () => {
  it('未配置时返回 undefined', () => {
    delete process.env[KEY];
    expect(getEnvImageMode()).toBeUndefined();
  });

  it('空值与纯空白视为未配置', () => {
    for (const v of ['', '   ']) {
      process.env[KEY] = v;
      expect(getEnvImageMode()).toBeUndefined();
    }
  });

  it('合法取值（大小写不敏感，自动去空白）', () => {
    for (const [raw, expected] of [
      ['direct', 'direct'],
      ['PROXY', 'proxy'],
      [' proxy ', 'proxy'],
    ] as const) {
      process.env[KEY] = raw;
      expect(getEnvImageMode()).toBe(expected);
    }
  });

  it('非法取值返回 undefined 而非抛错', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env[KEY] = 'custom';
    expect(getEnvImageMode()).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});


describe('isServerProxyDisabled', () => {
  const PROXY_KEY = 'DISABLE_SERVER_PROXY';
  const originalProxy = process.env[PROXY_KEY];

  afterEach(() => {
    if (originalProxy === undefined) delete process.env[PROXY_KEY];
    else process.env[PROXY_KEY] = originalProxy;
  });

  it('未配置 / 空值默认关闭', () => {
    for (const v of [undefined, '', '   ']) {
      if (v === undefined) delete process.env[PROXY_KEY];
      else process.env[PROXY_KEY] = v;
      expect(isServerProxyDisabled()).toBe(false);
    }
  });

  it('1 / true / yes / on 均视为开启，大小写与空白不敏感', () => {
    for (const v of ['1', 'TRUE', ' yes ', 'ON']) {
      process.env[PROXY_KEY] = v;
      expect(isServerProxyDisabled()).toBe(true);
    }
  });

  it('0 / false 显式关闭且不告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const v of ['0', 'false', 'off', 'no']) {
      process.env[PROXY_KEY] = v;
      expect(isServerProxyDisabled()).toBe(false);
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it('非法值告警并忽略', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.env[PROXY_KEY] = 'enabled';
    expect(isServerProxyDisabled()).toBe(false);
    expect(warn).toHaveBeenCalled();
  });
});
