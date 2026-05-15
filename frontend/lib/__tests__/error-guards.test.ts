import { describe, expect, it } from 'vitest';
import {
  getApiErrorMessage,
  getHttpStatusFromUnknown,
} from '@/lib/http/error-guards';

describe('getHttpStatusFromUnknown', () => {
  it('retorna undefined para valores não axios-like', () => {
    expect(getHttpStatusFromUnknown(new Error('fail'))).toBeUndefined();
    expect(getHttpStatusFromUnknown(null)).toBeUndefined();
    expect(getHttpStatusFromUnknown('err')).toBeUndefined();
  });

  it('extrai status de objeto com response.status', () => {
    expect(getHttpStatusFromUnknown({ response: { status: 404 } })).toBe(404);
    expect(getHttpStatusFromUnknown({ response: { status: 500 } })).toBe(500);
  });
});

describe('getApiErrorMessage', () => {
  it('usa fallback quando não há mensagem', () => {
    expect(getApiErrorMessage(new Error('x'), 'fb')).toBe('fb');
    expect(getApiErrorMessage(null, 'fb')).toBe('fb');
    expect(getApiErrorMessage({ response: {} }, 'fb')).toBe('fb');
  });

  it('prioriza response.data.message string', () => {
    expect(
      getApiErrorMessage({ response: { data: { message: 'Ops' } } }, 'fb'),
    ).toBe('Ops');
  });
});
