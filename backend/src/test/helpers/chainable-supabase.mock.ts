/**
 * Mock de cliente PostgREST estilo Supabase para testes unitários.
 * Enfileira respostas na ordem em que o código aguarda operações terminais
 * (maybeSingle, single, await builder, insert direto, update/delete com await).
 */

export type MockTerminalResult = {
  data?: unknown;
  error?: unknown;
  count?: number | null;
};

export function createQueuedSupabaseMock(queue: MockTerminalResult[]) {
  let idx = 0;
  const take = (): MockTerminalResult => {
    const r = queue[idx++];
    if (!r) {
      return { data: null, error: { message: `mock queue exhausted at #${idx}` } };
    }
    return r;
  };

  const resolveTerminal = () => {
    const r = take();
    return Promise.resolve({
      data: r.data ?? null,
      error: r.error ?? null,
      count: r.count ?? null,
    });
  };

  function deleteBuilder(): Record<string, unknown> {
    const b: Record<string, unknown> = {};
    b.eq = jest.fn(() => b);
    b.in = jest.fn(() => b);
    b.then = (onFulfilled?: (v: unknown) => unknown) => resolveTerminal().then(onFulfilled);
    b.catch = (onRejected?: (e: unknown) => unknown) => resolveTerminal().catch(onRejected);
    return b;
  }

  function updateBuilder(): Record<string, unknown> {
    const b: Record<string, unknown> = {};
    b.eq = jest.fn(() => b);
    b.then = (onFulfilled?: (v: unknown) => unknown) => resolveTerminal().then(onFulfilled);
    b.catch = (onRejected?: (e: unknown) => unknown) => resolveTerminal().catch(onRejected);
    return b;
  }

  function insertBuilder(): Record<string, unknown> {
    const b: Record<string, unknown> = {};
    b.select = jest.fn(() => b);
    b.single = jest.fn(() => resolveTerminal());
    b.then = (onFulfilled?: (v: unknown) => unknown) => resolveTerminal().then(onFulfilled);
    b.catch = (onRejected?: (e: unknown) => unknown) => resolveTerminal().catch(onRejected);
    return b;
  }

  function makeBuilder(): Record<string, unknown> {
    const chain = () => b;
    const b: Record<string, unknown> = {};
    for (const m of [
      'select',
      'eq',
      'is',
      'or',
      'in',
      'neq',
      'gte',
      'lte',
      'order',
      'limit',
      'range',
      'match',
      'not',
    ]) {
      b[m] = jest.fn(chain);
    }
    b.insert = jest.fn(() => insertBuilder());
    b.update = jest.fn(() => updateBuilder());
    b.delete = jest.fn(() => deleteBuilder());
    b.maybeSingle = jest.fn(() => resolveTerminal());
    b.single = jest.fn(() => resolveTerminal());
    b.then = (onFulfilled?: (v: unknown) => unknown) => resolveTerminal().then(onFulfilled);
    b.catch = (onRejected?: (e: unknown) => unknown) => resolveTerminal().catch(onRejected);
    return b;
  }

  const from = jest.fn(() => makeBuilder());

  return {
    getClient: () => ({ from }),
    from,
    /** Respostas ainda não consumidas */
    remaining: () => Math.max(0, queue.length - idx),
  };
}
