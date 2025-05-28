import { standardLibrary } from './library.js'

function tokenize(tokenObjs, index, file, source) {
  const lines = source.split('\n')
  const objs = lines.map((line, i) => line
    .split(/[ ]+/)
    .filter(e => !!e)
    .map((token, i) => ({ file, token, line: i, first: i == 0 }))
  ).flat()
  tokenObjs.splice(index + 1, 0, ...objs)
}

// function that stringifies json with numbers with max 2 decimals
export function json(obj) {
  return JSON.stringify(obj).replaceAll(/\.\d+/g, (match) => match.slice(0, 4))
}

export function interpret(source, opts) {
  for(const item of interpretIterate(source, opts)) {}
}

export function* interpretIterate(source, { files = {}, out }) {
  files['std'] = standardLibrary
  const tokenObjs = []
  tokenize(tokenObjs, -1, 'main', source)
  const stack = []
  const ctrl = []
  const dict = {}
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
    if (ctrl.at(-1) == 'compile') {
      if (token == '{') {
        ctrl.push('compile')
      }
      if (token == '}') {
        ctrl.pop()
      }
      if (token == 'include') throw new Error('include not available in blocks')
    }
    else if (token == 'include')
      tokenize(tokenObjs, index, peek(), files[pop()])
    else if (token == 'debug') { }
    else if (token == '{') {
      push(index+1)
      ctrl.push('compile')
    }
    else if (token == '}') {
      return requireJump(ctrl.pop())
    }
    else if (token == ':') {
      const jump = requireJump(pop())
      dict[pop()] = jump
    }
    else if (token == '?') {
      let condition = requireBool(pop()), a = pop(), b = pop()
      push(condition === true ? b : a)
    }
    else if (token == 'if') {
      let jump = requireJump(pop())
      if (requireBool(pop()) === true) {
        ctrl.push(index + 1)
        return jump
      }
    }
    else if (token == '{') ctrl.push(index, 'compile')
    else if (token == 'loop') {
      if (ctrl.at(-1) != 'loop') {
        ctrl.push(pop(), 'loop')
      }
      let jump = ctrl.at(-2)
      if (requireBool(pop()) === true) {
        ctrl.push(index)
        return jump
      } else {
        ctrl.pop()
        ctrl.pop()
      }
    }
    else if (token == 'range') {
      ctrl.push(requireNumber(pop()))
      ctrl.push(requireNumber(pop()))
      ctrl.push(requireJump(pop()))
    }
    else if (token == 'enumerate') {
      const jump = ctrl.pop()
      const from = ctrl.pop()
      const to = ctrl.pop()
      if (from < to) {
        ctrl.push(to)
        ctrl.push(from + 1)
        ctrl.push(jump)
        ctrl.push(index)
        return jump
      }
    }
    else if (token == 'i') {
      push(ctrl.at(-3) - 1)
    }
    else if (token == '(') {
      while (index < tokenObjs.length && tokenObjs[index].token != ')') index++
    }
    else if (token == '>@') ctrl.push(pop())
    else if (token == '@>') push(ctrl.pop())
    else if (token == '@copy') push(ctrl.at(-1))
    // ------
    else if (dict[token]) {
      ctrl.push(index + 1) // set return adress to next token
      return dict[token]
    }
    else if (token == 'log') out(json(peek()))
    else if (token == '.') out(json(pop()))
    else if (token == '...') out(json(stack))
    else if (token == '..c') out(json(ctrl))
    else if (token == '..d') out(json(dict))
    else if (token == 'trace') out(`${json(stack)} ${json(ctrl)}`)
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
    else if (token == 'concat') {
      const a = pop(), b = pop()
      push(`${b}${a}`)
    }
    else if (token == 'pick') push(stack.at(-requireInt(pop())))
    else if (token == 'over') push(stack.at(-2))
    else if (token == 'dup') push(peek())
    else if (token == 'neg') push(-requireNumber(pop()))
    else if (token == 'not') push(!requireBool(pop()))
    else if (token == 'true') push(true)
    else if (token == 'false') push(false)
    else if (token.match(/^-?[0-9.]+$/)) push(+token)
    else if (token.match(/"[^"]*"/)) push(token.replaceAll('"', ''))
    else throw new Error(`unknown token ${token}`)
    return index + 1
  }
  while (index<tokenObjs.length) {
    const { token, line, file } = tokenObjs[index]
    try {
      index = evaluate(token)
    } catch (error) {
      out(`${file}:${line} error evaluating "${token}" ${error.message}`)
      console.error(error)
      throw new Error(`${file}:${line} error on "${token}" ${error.message}`)
    }
    yield { index, token, stack, ctrl, tokenObjs: tokenObjs }
  }
  if (ctrl.length > 0) {
    out('Unmatched control flow')
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
const requireJump = asserter(e => e < 0 || e > 10000, 'required a boolean')
const requireInt = asserter(e => e % 1 !== 0, 'required an integer')
