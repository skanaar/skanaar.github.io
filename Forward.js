import { el, App, useEvent } from './assets/system.js'
import { useScript } from './assets/useScript.js'

export const app = new App('Forward', Forward, 'cube.svg')

function Forward() {
  const [source, setSource] = React.useState('')
  const [out, setOut] = React.useState('')
  const onChange = (e) => setSource(e.target.value)
  const onRun = (e) => {
    const tokens = source.split(/[ \n]+/)
    const stack = []
    const ctrl = []
    const dict = {}
    const push = (e) => stack.push(e)
    const pop = () => stack.pop()
    const peek = () => stack.at(-1)
    const evaluate = (token) => {
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
      if (token == '.') setOut(JSON.stringify(peek()))
      if (token == '...') setOut(JSON.stringify(stack))
      if (token == '..c') setOut(JSON.stringify(ctrl))
      if (token == '..d') setOut(JSON.stringify(dict))
      if (token == '+') push(pop() + pop())
      if (token == '-') push(-pop() + pop())
      if (token == '*') push(pop() * pop())
      if (token == '/') push(pop() / pop())
      if (token == '=') push(pop() === pop())
      if (token == '>') push(pop() > pop())
      if (token == '<') push(pop() < pop())
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

      if (token == 'true') push(true)
      if (token == 'false') push(false)
      if (token.match(/^[0-9]+$/)) push(+token)
      if (token.match(/"[0-9a-zA-Z]*"/)) push(token.replaceAll('"', ''))
    }
    for (const token of tokens) {
      console.log(stack, ctrl, dict)
      evaluate(token)
    }
  }

  return el('forward-app', { className: 'padded' },
    el('style', {}, css),
    el('textarea-host', {},
      el('textarea', { value: source, onChange }),
    ),
    el('p', {}, out),
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
  padding: 4px;
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
`
