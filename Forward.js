import { el, App, useEvent } from './assets/system.js'
import { useScript } from './assets/useScript.js'

export const app = new App('Forward', Forward, 'cube.svg')

const LOOP_START = -1
const LOOP_COUNT = -2

function interpret(source, out) {
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
    console.log(token, JSON.stringify({ stack, ctrl, dict }))
    if (ctrl.at(-1) == 'skip;') {
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
    if (token == '+') push(pop() + pop())
    if (token == '-') push(-pop() + pop())
    if (token == '*') push(pop() * pop())
    if (token == '/') push((1/pop()) * pop())
    if (token == '=') push(pop() === pop())
    if (token == '>') push(pop() > pop())
    if (token == '<') push(pop() < pop())
    if (token == 'swap') { const t = pop(); push(pop(), t) }
    if (token == 'dup') push(peek())
    if (token == 'neg') push(-pop())
    if (token == 'not') push(!pop())
    if (token == '?') push(pop() ? pop() : (pop(), pop()))
    if (token == 'if') if (pop() !== true) ctrl.push('skip;')
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
    if (token == 'i') push(ctrl.at(LOOP_COUNT))

    if (token == 'true') push(true)
    if (token == 'false') push(false)
    if (token.match(/^[0-9]+$/)) push(+token)
    if (token.match(/"[0-9a-zA-Z]*"/)) push(token.replaceAll('"', ''))
  }
  for (; index<tokens.length; index++) {
    evaluate(tokens[index])
  }
}

function Forward() {
  const [source, setSource] = React.useState('10 { i 5 - dup * neg 25 + }loop ...')
  const [out, setOut] = React.useState('')
  const onChange = (e) => setSource(e.target.value)
  const onRun = (e) => {
    interpret(source, setOut)
  }

  return el('forward-app', { class: 'padded' },
    el('style', {}, css),
    el('textarea-host', {},
      el('textarea', { value: source, onChange }),
    ),
    el('span', { class: 'console' }, out),
    el('button', { className: 'btn', onClick: onRun }, 'Run'),
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
