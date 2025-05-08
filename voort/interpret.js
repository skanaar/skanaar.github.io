import { standardLibrary } from './library.js'

const LOOP_START = -1
const LOOP_COUNT = -2

function tokenize(tokenObjs, index, file, source) {
  const lines = source.split('\n')
  const objs = lines.map((line, i) => line
    .split(/[ ]+/)
    .filter(e => !!e)
    .map(token => ({ file, token, line: i }))
  ).flat()
  tokenObjs.splice(index + 1, 0, ...objs)
}

// function that stringifies json with numbers with max 2 decimals
export function json(obj) {
  return JSON.stringify(obj).replaceAll(/\.\d+/g, (match) => match.slice(0, 4));
}

export function interpret(source, { files = {}, out }) {
  files['std'] = standardLibrary
  source = '"std" include ' + source
  const tokenObjs = []
  tokenize(tokenObjs, -1, 'main', source)
  const stack = []
  const ctrl = []
  const dict = {}
  const data = []
  const push = (e) => stack.push(requireNotNull(e))
  const pop = () => {
    if (stack.length === 0) throw new Error('cannot pop empty stack')
    return stack.pop()
  }
  const peek = () => {
    if (stack.length === 0) throw new Error('cannot peek empty stack')
    return stack.at(-1)
  }
  let index = 0
  const evaluate = (token) => {
    if (ctrl.at(-1) == 'skip_to_fi') {
      if (token === 'fi') ctrl.pop()
      return
    }
    if (ctrl.at(-1) == 'skip_to_;') {
      if (token === ';') ctrl.pop()
      return
    }
    if (dict[token]) {
      ctrl.push(index)
      index = dict[token]
      return
    }
    if (token == 'include') tokenize(tokenObjs, index, peek(), files[pop()])
    else if (token == 'log') out(json(peek()))
    else if (token == '.') out(json(pop()))
    else if (token == '...') out(json(stack))
    else if (token == '..c') out(json(ctrl))
    else if (token == '..d') out(json(dict))
    else if (token == 'trace')
      out(`${json(stack)} ${json(ctrl)}`)
    else if (token == 'drop') pop()
    else if (token == '+') push(pop() + pop())
    else if (token == '-') push(-pop() + pop())
    else if (token == '*') push(pop() * pop())
    else if (token == '/') { let d = pop(); push(pop() / d) }
    else if (token == 'pow') { const exp = pop(); push(Math.pow(pop(), exp)) }
    else if (token == '=') push(pop() === pop())
    else if (token == '>') push(requireNumber(pop()) > requireNumber(pop()))
    else if (token == '<') push(requireNumber(pop()) < requireNumber(pop()))
    else if (token == 'swap') { const a = pop(), b = pop(); push(a); push(b) }
    else if (token == 'rot') {
      const a = pop(), b = pop(), c = pop();
      push(b)
      push(a)
      push(c)
    }
    else if (token == '-rot') {
      const a = pop(), b = pop(), c = pop();
      push(a)
      push(c)
      push(b)
    }
    else if (token == '>@') ctrl.push(pop())
    else if (token == '@>') push(ctrl.pop())
    else if (token == 'concat') {
      const a = pop(), b = pop()
      push(`${b}${a}`)
    }
    else if (token == 'pick') push(stack.at(-requireInt(pop())))
    else if (token == 'over') push(stack.at(-2))
    else if (token == 'dup') push(peek())
    else if (token == 'neg') push(-requireNumber(pop()))
    else if (token == 'not') push(!requireBool(pop()))
    else if (token == '?') {
      let condition = requireBool(pop()), a = pop(), b = pop()
      push(condition === true ? b : a)
    }
    else if (token == 'if') {
      if (requireBool(pop()) !== true) ctrl.push('skip_to_fi')
    }
    else if (token == ':') {
      ctrl.push('skip_to_;')
      dict[pop()] = index
    }
    else if (token == ';') index = ctrl.pop()
    else if (token == '{') ctrl.push(pop(), index)
    else if (token == '}loop') {
      if (ctrl.at(LOOP_COUNT)>0) {
        index = ctrl.at(LOOP_START)
        ctrl[ctrl.length+LOOP_COUNT] -= 1
      } else {
        ctrl.pop()
        ctrl.pop()
      }
    }
    else if (token == '(') {
      while (index<tokenObjs.length && tokenObjs[index].token!=')') index++
    }
    else if (token == 'i') push(ctrl.at(LOOP_COUNT))
    else if (token == 'true') push(true)
    else if (token == 'false') push(false)
    else if (token.match(/^-?[0-9.]+$/)) push(+token)
    else if (token.match(/"[^"]*"/)) push(token.replaceAll('"', ''))
    else throw new Error(`unknown token ${token}`)
  }
  for (; index<tokenObjs.length; index++) {
    const { token, line, file } = tokenObjs[index]
    try {
      evaluate(token)
    } catch (error) {
      out(`${file}:${line} error evaluating "${token}" ${error.message}`)
      console.error(error)
    }
  }
  if (ctrl.length > 0) {
    out('Unmatched control flow, are you missing a ":"?')
  }
}

function asserter(test, msg) {
  return (value) => {
    if (test(value)) throw new Error(msg)
    return value
  }
}
const requireNotNull = asserter(e => e == null, 'null disallowed')
const requireNumber = asserter(e => 'number' !== typeof e, 'required a number')
const requireString = asserter(e => 'string' !== typeof e, 'required a string')
const requireBool = asserter(e => 'boolean' !== typeof e, 'required a boolean')
const requireInt = asserter(e => e % 1 !== 0, 'required an integer')
