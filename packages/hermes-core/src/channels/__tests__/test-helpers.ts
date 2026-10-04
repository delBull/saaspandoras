export function describe(name: string, fn: () => void) {
  fn();
}

export function it(name: string, fn: () => void | Promise<void>) {
  Promise.resolve(fn()).catch((err) => {
    console.error(`[Test Failed] ${name}:`, err);
  });
}

export function beforeEach(fn: () => void | Promise<void>) {
  Promise.resolve(fn()).catch(console.error);
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    not: {
      toBe(expected: any) {
        if (actual === expected) {
          throw new Error(`Expected ${actual} NOT to be ${expected}`);
        }
      },
      toContain(expected: any) {
        if (typeof actual === 'string' && actual.includes(expected)) {
          throw new Error(`Expected ${actual} NOT to contain ${expected}`);
        }
      }
    },
    toContain(expected: any) {
      if (typeof actual === 'string' && !actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    rejects: {
      async toThrow(expectedErrorClass?: any) {
        try {
          await actual;
          throw new Error('Expected promise to reject but it resolved');
        } catch (err: any) {
          if (err.message === 'Expected promise to reject but it resolved') {
            throw err;
          }
          if (expectedErrorClass && !(err instanceof expectedErrorClass)) {
            throw new Error(`Expected error to be instance of ${expectedErrorClass.name}, got ${err.name}`);
          }
        }
      }
    }
  };
}
