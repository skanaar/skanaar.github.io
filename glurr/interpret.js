export const JUMP_OFFSET = 0x100000000

function tokenize(tokenObjs, index, file, source) {
  const lines = source.split('\n')
  const objs = lines.map((line, i) => line
    .split(/[ ]/)
    .map((token, i) => ({ file, token, line: i, first: i == 0 }))
  ).flat()
  tokenObjs.splice(index + 1, 0, ...objs)
}

// function that stringifies json with numbers with max 2 decimals
export function json(obj) {
  return JSON.stringify(obj).replaceAll(/\.\d+/g, (match) => match.slice(0, 4))
}

export function interpret(filename, opts) {
  for(const item of interpretIterate(filename, opts)) {}
}

export function* interpretIterate(filename, { files, out }) {
  const tokenObjs = []
  tokenize(tokenObjs, -1, filename, files[filename])
  const stack = []
  const ctrl = []
  const dict = {}
  const vars = {}
  const data = {}
  const blockEnds = []
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
    if (token == '') { }
    else if (ctrl.at(-1) == 'compile') {
      if (token == '{') {
        ctrl.push(encodeJump(index))
        ctrl.push('compile')
      }
      if (token == '}') {
        blockEnds[decodeJump(ctrl.at(-2))] = index + 1
        ctrl.pop()
        ctrl.pop()
      }
      if (token == 'include') throw new Error('include not available in blocks')
    }
    /// #Words
    /// "include" `"std" include` import a source file
    else if (token == 'include') {
      tokenize(tokenObjs, index, peek(), files[pop()])
    }
    /// "debug" `debug` pause interpreter in debug mode
    else if (token == 'debug') { }
    /// "{" `{ ... }` enter compilation mode and push jump reference to the stack
    else if (token == '{') {
      push(encodeJump(index+1))
      if (blockEnds[index]) return blockEnds[index]
      ctrl.push(encodeJump(index))
      ctrl.push('compile')
    }
    /// "}" `{ ... }` exit compilation, in runtime mode: return to call site
    else if (token == '}') {
      return decodeJump(ctrl.pop())
    }
    /// ":" `name { ... } :` define a new word that bind name to block
    else if (token == ':') {
      const jump = decodeJump(pop())
      dict[requireString(pop())] = jump
    }
    /// "byte-array" `.name size byte-array` create byte array bound to symbol
    else if (token == 'byte-array') {
      const size = requireInt(pop())
      const name = requireSymbol(pop())
      data[name] = new Uint8Array(size)
    }
    /// "set" `.name index value set` write value to array
    else if (token == 'set') {
      const value = requireNumber(pop())
      const offset = requireInt(pop())
      const name = requireSymbol(pop())
      data[name][offset] = value
    }
    /// "get" `.name index get` read from array
    else if (token == 'get') {
      const offset = requireInt(pop())
      const name = requireSymbol(pop())
      push(data[name][offset])
    }
    /// "display-image" `.name width display-image` display a byte-array as an rgba image
    else if (token == 'display-image') {
      const width = requireInt(pop())
      const ref = requireDataRef(pop())
      out({ type: 'image', width, data: data[ref] })
    }

    /// #Control flow
    /// "?" `bool x y ?` if bool is true push x to the stack, otherwise push y
    else if (token == '?') {
      let onFalse = pop(), onTrue = pop(), condition = requireBool(pop())
      push(condition === true ? onTrue : onFalse)
    }
    /// "if" `bool { block } ?` if bool then invoke block
    else if (token == 'if') {
      let jump = decodeJump(pop())
      if (requireBool(pop()) === true) {
        ctrl.push(encodeJump(index + 1))
        return jump
      }
    }
    /// "loop" `true { ... bool } loop` repeat block while true is on the stack
    else if (token == 'loop') {
      if (ctrl.at(-1) != 'loop') {
        ctrl.push(pop(), 'loop')
      }
      let jump = decodeJump(ctrl.at(-2))
      if (requireBool(pop()) === true) {
        ctrl.push(encodeJump(index))
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
    /// "range enumerate" `{ i ... } 0 10 range enumerate` repeate block 10 times
    else if (token == 'enumerate') {
      const jump = decodeJump(ctrl.pop())
      const from = ctrl.pop()
      const to = ctrl.pop()
      if (from < to) {
        ctrl.push(to)
        ctrl.push(from + 1)
        ctrl.push(encodeJump(jump))
        ctrl.push(encodeJump(index))
        return jump
      }
    }
    /// "leave-if" `{ true leave-if } 0 10 range enumerate` leave range loop if true is on the stack
    else if (token == 'leave-if') {
      if (requireBool(pop())) {
        const jump = decodeJump(ctrl.pop())
        ctrl.pop()
        ctrl.pop()
        ctrl.pop()
        return jump + 1
      }
    }
    /// "i" `{ i } 0 10 range enumerate` push iteration index to the stack
    else if (token == 'i') {
      push(ctrl.at(-3) - 1)
    }
    /// "( )" `( n - n )` comment
    else if (token == '(') {
      while (index < tokenObjs.length && tokenObjs[index].token != ')') index++
    }
    else if (token == '>@') ctrl.push(pop())
    else if (token == '@>') push(ctrl.pop())
    else if (token == '@copy') push(ctrl.at(-1))
    else if (dict[token]) {
      ctrl.push(encodeJump(index + 1)) // set return adress to next token
      return dict[token]
    }

    else if (token == 'log') out(json(peek()))
    else if (token == '.') out(pop())
    else if (token == '...') out(json(stack))
    else if (token == 'trace') out(`${json(stack)} ${json(ctrl)}`)

    /// #Math
    else if (token == 'drop') pop()
    /// "+" `3 2 +` addition
    else if (token == '+') push(pop() + pop())
    /// "-" `3 2 -` subtraction
    else if (token == '-') push(-pop() + pop())
    /// "*" `3 2 *` multiplication
    else if (token == '*') push(pop() * pop())
    /// "/" `3 2 /` division
    else if (token == '/') { let d = pop(); push(pop() / d) }
    /// "pow" `3 2 pow` exponentiation
    else if (token == 'pow') { const exp = pop(); push(Math.pow(pop(), exp)) }
    else if (token == 'mod') { let d = pop(); push(pop() % d) }
    else if (token == 'floor') push(Math.floor(pop()))
    else if (token == 'ceil') push(Math.ceil(pop()))
    else if (token == 'round') push(Math.round(pop()))
    else if (token == 'abs') push(Math.ceil(abs))
    else if (token == 'neg') push(-requireNumber(pop()))

    /// #Logic
    /// "=" `1 1 =` Equality
    else if (token == '=') push(pop() === pop())
    /// ">" `3 2 >` Greater than
    else if (token == '>') push(requireNumber(pop()) < requireNumber(pop()))
    /// "<" `2 3 <` Less than
    else if (token == '<') push(requireNumber(pop()) > requireNumber(pop()))
    /// "not" `true not` Invert boolean value
    else if (token == 'not') push(!requireBool(pop()))
    /// "true" `true` Boolean value
    else if (token == 'true') push(true)
    /// "false" `false` Boolean value
    else if (token == 'false') push(false)

    /// #Stack manipulation
    /// "swap" `3 2 swap` Swaps places of the two top stack items
    else if (token == 'swap') { const a = pop(), b = pop(); push(a); push(b) }
    /// "rot" `1 2 3 rot` Moves the third stack item to the top. (a b c - b c a)
    /// "-rot" `1 2 3 rot` Moves the top stack two steps down. (a b c - c a b)
    else if (token == 'rot') {
      const a = pop(), b = pop(), c = pop();
      push(b)
      push(a)
      push(c)
    }
    /// "pick" `7 8 9 3 pick ( 7 8 9 7 )` Copy and push the nth item.
    else if (token == 'pick') push(stack.at(-requireInt(pop())))
    /// "over" `1 2 over ( 1 2 1 )` Copies the second stack item.
    else if (token == 'over') push(stack.at(-2))
    /// "dup" `1 dup ( 1 1 )` Duplicates the top stack item
    else if (token == 'dup') push(peek())
    else if (token == 'concat') {
      const a = pop(), b = pop()
      push(`${b}${a}`)
    }
    /// "=:" `.pi 3.14 =:` Define a variable by binding a value to a symbol
    else if (token == '=:') {
      const value = pop()
      const name = requireSymbol(pop())
      if (name in vars) throw new Error(`${name} already bound to variable`)
      vars[name] = value
    }
    /// "@" `.counter @` Read value of a variable
    else if (token == '@') push(vars[requireSymbol(pop())])
    /// "!" `7 .counter !` Write value of a variable
    else if (token == '!') {
      const name = requireSymbol(pop())
      const value = pop()
      if (!(name in vars)) throw new Error(`${name} not bound to a variable`)
      vars[name] = value
    }
    else if (token.match(/^-?[0-9.]+$/)) push(+token)
    else if (token.match(/^\.[a-z0-9_-]+$/)) push(token)
    else if (token.match(/"[^"]*"/)) push(token.replaceAll('"', ''))
    else throw new Error(`unknown token ${token}`)
    return index + 1
  }
  while (index<tokenObjs.length) {
    const { token, line, file } = tokenObjs[index]
    yield { index, token, stack, ctrl, tokenObjs, vars }
    try {
      index = evaluate(token)
    } catch (error) {
      out(`${file}:${line} error evaluating "${token}" ${error.message}`)
      console.error(error)
      throw new Error(`${file}:${line} error on "${token}" ${error.message}`)
    }
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
const encodeJump = index => index + JUMP_OFFSET
const decodeJump = (value) => requireJump(value) - JUMP_OFFSET
const requireNotNull = asserter(e => e == null, 'null disallowed')
const requireJump = asserter(e => e < JUMP_OFFSET, 'expected a jump')
const requireDataRef = asserter(e => 'string' !== typeof e, 'expected data ref')
const requireNumber = asserter(e => 'number' !== typeof e, 'expected a number')
const requireString = asserter(e => 'string' !== typeof e, 'expected a string')
const requireSymbol = asserter(
  e => 'string' !== typeof e || e.length < 2 || e[0] != '.',
  'expected a symbol'
)
const requireBool = asserter(e => 'boolean' !== typeof e, 'expected a boolean')
const requireInt = asserter(e => e % 1 !== 0, 'expected an integer')

/// #Standard library
/// "-rot" `1 2 3 -rot` Move the top stack items two steps down the stack
/// "2dup" `1 2 2dup` duplicate the top two stack items
/// "over" `1 2 over`
/// "factorial" `"factorial" { dup 1 > { dup 1 - factorial * } if } :`
/// "sin" `0.4 pi * sin`
/// "cos" `0.4 pi * cos`
/// "create-canvas" `.name width height create-canvas` create an RGBA bitmap
/// "set-pixel" `r g b a .name index set-pixel` set pixel of a bitmap
