import { el, App, useEvent } from './assets/system.js'
import { useScript } from './assets/useScript.js'

export const app = new App('Voort', Voort, 'voort.svg')

const LOOP_START = -1
const LOOP_COUNT = -2

function test(source, rawExpected) {
  let actual = null
  interpret(source, { out: e => actual = e })
  let expected = JSON.stringify(rawExpected)
  if (actual !== expected)
    throw new Error(`got ${actual} expected ${expected} from "${source}"`)
  else console.log(`test passed ${source}`)
}

function testsuite() {
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
  test('3 true if 7 ; .', 7)
  test('3 false if 7 ; .', 3)
  test('4 { i }loop + + + .', 3+2+1)
  test('"foo" : 7 ; foo .', 7)
}

function interpret(source, { out, trace }) {
  const tokens = source.split(/[ \n]+/)
  const stack = []
  const ctrl = []
  const dict = {}
  const data = []
  const push = (e) => stack.push(e)
  const pop = () => stack.pop()
  const peek = () => stack.at(-1)
  let index = 0
  const evaluate = (token) => {
    if (trace) console.log(token, JSON.stringify({ stack, ctrl, dict }))
    if (ctrl.at(-1) == 'skip_to_;') {
      if (token === ';') ctrl.pop()
      return
    }
    if (ctrl.at(-1) == 'define') {
      if (token === ';') ctrl.pop(), ctrl.pop()
      else dict[ctrl.at(-2)].push(token)
      return
    }
    if (dict[token]) {
      for (const tok of dict[token]) evaluate(tok)
      return
    }
    if (token == '.') out(JSON.stringify(peek()))
    if (token == '...') out(JSON.stringify(stack))
    if (token == '..c') out(JSON.stringify(ctrl))
    if (token == '..d') out(JSON.stringify(dict))
    if (token == 'drop') pop()
    if (token == '+') push(pop() + pop())
    if (token == '-') push(-pop() + pop())
    if (token == '*') push(pop() * pop())
    if (token == '/') { let d = pop(); push(pop() / d) }
    if (token == 'pow') { const exp = pop(); push(Math.pow(pop(), exp)) }
    if (token == '=') push(pop() === pop())
    if (token == '>') push(pop() > pop())
    if (token == '<') push(pop() < pop())
    if (token == 'swap') { const a = pop(), b = pop(); push(a); push(b) }
    if (token == 'dup') push(peek())
    if (token == 'neg') push(-pop())
    if (token == 'not') push(!pop())
    if (token == '?') {
      let condition = pop(), a = pop(), b = pop()
      push(condition === true ? b : a)
    }
    if (token == 'if') if (pop() !== true) ctrl.push('skip_to_;')
    if (token == ':') {
      ctrl.push(peek())
      ctrl.push('define')
      dict[pop()] = []
    }
    if (token == '{') ctrl.push(pop(), index)
    if (token == '}loop') {
      if (ctrl.at(LOOP_COUNT)>0) {
        index = ctrl.at(LOOP_START)
        ctrl[ctrl.length+LOOP_COUNT] -= 1
      } else {
        ctrl.pop()
        ctrl.pop()
      }
    }
    if (token == '(') while (index<tokens.length && tokens[index]!=')') index++
    if (token == 'i') push(ctrl.at(LOOP_COUNT))

    if (token == 'true') push(true)
    if (token == 'false') push(false)
    if (token.match(/^[0-9.]+$/)) push(+token)
    if (token.match(/"[^"]*"/)) push(token.replaceAll('"', ''))
  }
  for (; index<tokens.length; index++) {
    evaluate(tokens[index])
  }
}

function Voort() {
  const [source, setSource] = React.useState('10 { i 5 - dup * neg 25 + }loop ...')
  const [out, setOut] = React.useState('')
  const [trace, setTrace] = React.useState(false)
  const onChange = (e) => setSource(e.target.value)
  const onRun = (e) => {
    interpret(source, { out: setOut, trace })
  }

  React.useEffect(testsuite, [])

  return el('forward-app', { class: 'padded' },
    el('style', {}, css),
    el('textarea-host', {},
      el('textarea', { value: source, onChange }),
    ),
    el('span', { class: 'console' }, out),
    el('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
      el('button', { className: 'btn', onClick: onRun }, 'Run'),
      el('label', {},
        el('input', {
          type: 'checkbox',
          onChange: (e) => setTrace(e.target.checked)
        }),
        el('span', {}, 'Trace')
      )
    )
  )
}

const css = `
forward-app {
}
forward-app textarea-host {
  display: block;
  box-sizing: border-box;
  height: 200px;
  width: 300px;
}
forward-app textarea {
  box-sizing: border-box;
  font-family: 'Monaco', monospace;
  height: 100%;
  width: 100%;
  border: 2px solid black;
  padding: 5px;
  line-height: 22px;
}
forward-app .console {
  display: block;
  border: 2px solid black;
  padding: 2px;
  margin: 4px 0;
  min-height: 1.2em;
}
`
