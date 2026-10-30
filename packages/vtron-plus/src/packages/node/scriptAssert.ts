type Message = string | Error;
type Options = { message?: string; actual?: unknown; expected?: unknown; operator?: string };
type Comparison = (actual: unknown, expected: unknown, message?: Message) => void;

function display(value: unknown): string {
  if (typeof value === 'number' && Object.is(value, -0)) return '-0';
  if (typeof value !== 'object' && typeof value !== 'string') return String(value);
  try { return JSON.stringify(value) ?? String(value); } catch { return Object.prototype.toString.call(value); }
}

export class ScriptAssertionError extends Error {
  code = 'ERR_ASSERTION';
  actual: unknown;
  expected: unknown;
  operator: string | undefined;
  generatedMessage: boolean;
  constructor(options: Options) {
    if (!options || typeof options !== 'object') throw new TypeError('AssertionError options must be an object');
    super(options.message === undefined ? `${display(options.actual)} ${options.operator || 'fail'} ${display(options.expected)}` : String(options.message));
    this.name = 'AssertionError';
    this.actual = options.actual;
    this.expected = options.expected;
    this.operator = options.operator;
    this.generatedMessage = options.message === undefined;
  }
}

interface ScriptAssert {
  (value?: unknown, message?: Message): void;
  ok: (value?: unknown, message?: Message) => void;
  fail: (message?: Message) => never;
  equal: Comparison;
  notEqual: Comparison;
  strictEqual: Comparison;
  notStrictEqual: Comparison;
  AssertionError: typeof ScriptAssertionError;
  strict: ScriptAssert;
}

/** Basic assertions only. Failed checks always throw; there are no no-op fallbacks. */
export function createScriptAssert(): { assert: ScriptAssert; strict: ScriptAssert } {
  function failCheck(actual: unknown, expected: unknown, operator: string, message?: Message, fallback?: string): never {
    if (message instanceof Error) throw message;
    const error = new ScriptAssertionError({ actual, expected, operator, message });
    if (message === undefined && fallback) error.message = fallback;
    throw error;
  }
  function ok(value?: unknown, message?: Message) {
    if (!value) failCheck(value, true, '==', message, arguments.length ? 'Expected a truthy value; received ' + display(value) : 'No value argument passed to `assert.ok()`');
  }
  function comparison(operator: string, passes: (actual: unknown, expected: unknown) => boolean): Comparison {
    return function (actual: unknown, expected: unknown, message?: Message) {
      if (arguments.length < 2) throw Object.assign(new TypeError('The actual and expected arguments must be specified'), { code: 'ERR_MISSING_ARGS' });
      if (!passes(actual, expected)) failCheck(actual, expected, operator, message);
    };
  }
  const looseEqual = (actual: unknown, expected: unknown) => actual == expected || (Number.isNaN(actual) && Number.isNaN(expected));
  const strictEqual = comparison('strictEqual', Object.is);
  const notStrictEqual = comparison('notStrictEqual', (actual, expected) => !Object.is(actual, expected));
  const methods = {
    ok,
    fail(message?: Message): never {
      if (arguments.length > 1) throw Object.assign(new Error('assert.fail supports only the message argument'), { code: 'ERR_NOT_SUPPORTED' });
      return failCheck(undefined, undefined, 'fail', message, 'Failed');
    },
    equal: comparison('==', looseEqual),
    notEqual: comparison('!=', (actual, expected) => !looseEqual(actual, expected)),
    strictEqual,
    notStrictEqual,
    AssertionError: ScriptAssertionError,
  };
  const assert = Object.assign(ok, methods) as ScriptAssert;
  const strict = Object.assign(function strict(value?: unknown, message?: Message) {
    if (arguments.length) ok(value, message); else ok();
  }, methods, { equal: strictEqual, notEqual: notStrictEqual }) as ScriptAssert;
  assert.strict = strict;
  strict.strict = strict;
  return { assert, strict };
}
