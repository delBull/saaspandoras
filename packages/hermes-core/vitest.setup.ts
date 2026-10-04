import { vi } from 'vitest';

vi.mock('@saasfly/db-core', async (importOriginal) => {
  const actual: any = await importOriginal();
  const dbMock = {
    select: vi.fn(() => dbMock),
    selectDistinct: vi.fn(() => dbMock),
    from: vi.fn(() => dbMock),
    where: vi.fn(() => dbMock),
    leftJoin: vi.fn(() => dbMock),
    innerJoin: vi.fn(() => dbMock),
    limit: vi.fn(() => dbMock),
    orderBy: vi.fn(() => dbMock),
    insert: vi.fn(() => dbMock),
    values: vi.fn(() => dbMock),
    onConflictDoNothing: vi.fn(() => dbMock),
    onConflictDoUpdate: vi.fn(() => dbMock),
    update: vi.fn(() => dbMock),
    set: vi.fn(() => dbMock),
    returning: vi.fn(() => dbMock),
    delete: vi.fn(() => dbMock),
    transaction: vi.fn(async (cb: any) => cb(dbMock)),
    execute: vi.fn(() => []),
    then: vi.fn((resolve) => resolve([])),
    catch: vi.fn((resolve) => resolve([])),
    query: new Proxy({}, {
      get: () => ({
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      })
    }),
  };

  return {
    ...actual,
    db: dbMock,
    sql: vi.fn((strs, ...vals) => strs.join('?')),
  };
});
