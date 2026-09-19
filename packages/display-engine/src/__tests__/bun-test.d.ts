declare module "bun:test" {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: any): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toContain(expected: any): void;
    not: {
      toContain(expected: any): void;
      toBe(expected: any): void;
      toEqual(expected: any): void;
    };
    [key: string]: any;
  };
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export const vi: any;
  export const mock: any;
}
