import { interpret } from './interpret.js'

function test(source, rawExpected) {
  let actual = null
  interpret('main', { files: { main: source }, out: e => actual = e })
  let expected = rawExpected
  if (actual !== expected)
    throw new Error(`got ${actual} expected ${expected} from "${source}"`)
}

export function testsuite() {
  test('7 3 + .', 10)
  test('7 3 - .', 4)
  test('7 3 / .', 7/3)
  test('7 3 / .', 7/3)
  test('7 3 .', 3)
  test('7 3 drop .', 7)
  test('7 3 swap .', 7)
  test('7 3 swap swap .', 3)
  test('2 dup + .', 4)
  test('true 7 3 ? .', 7)
  test('true not 7 3 ? .', 3)
  test('7 neg .', -7)
  test('"foo" { 7 } : foo .', 7)
  test('false true true 0 true { 1 + swap } loop .', 3)
}
