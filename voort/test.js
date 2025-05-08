import { interpret, json } from './interpret.js'

function test(source, rawExpected) {
  let actual = null
  interpret(source, { out: e => actual = e })
  let expected = json(rawExpected)
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
  test('7 3 true ? .', 7)
  test('7 3 true not ? .', 3)
  test('7 neg .', -7)
  test('4 { i }loop + + + .', 3+2+1)
  test('"foo" : 7 ; foo .', 7)
}
