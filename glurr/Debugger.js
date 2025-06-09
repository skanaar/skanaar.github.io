import { el } from '../assets/system.js'
import { interpretIterate, JUMP_OFFSET } from './interpret.js'

export function Debugger({ app, filename, files, onStop }) {
  const [mode, setMode] = React.useState('stopped')
  const [debugIterator, setDebugIterator] = React.useState(null)
  const [debugState, setDebugState] = React.useState(null)
  const [breakpoints, setBreakpoints] = React.useState([])

  const onStart = () => {
    app.trigger('clear-output')
    const iterator = interpretIterate(filename, {
      files: files,
      out: (val) => app.trigger('output', val),
    })
    const result = iterator.next()
    if (result.done) {
      setMode('stopped')
      setDebugState(null)
    } else {
      setDebugIterator(iterator)
      setDebugState(result.value)
      setMode('paused')
    }
  }
  const onResume = () => {
    setMode('running')
    for (let i = 0; ; i++) {
      const { done, value } = debugIterator.next()
      if (done) {
        setMode('ended')
        break
      }
      if (i % 100 === 0) setDebugState(value)
      if (value.token === 'debug' || breakpoints.includes(value.index)) {
        setDebugState(value)
        setMode('paused')
        scrollPausePointIntoView()
        break
      }
    }
  }
  const onStep = () => {
    if (!debugIterator) return
    let iterator = debugIterator.next()
    if (iterator.done) return
    while (iterator.value.token === '')
      iterator = debugIterator.next()
    setDebugState(iterator.value)
    scrollPausePointIntoView()
  }
  const onStepOver = () => {
    if (!debugIterator || !debugState) return
    let startLen = debugState.ctrl.length
    let iterator = debugIterator.next()
    if (iterator.done) return
    while (iterator.value.token === '' || iterator.value.ctrl.length > startLen)
      iterator = debugIterator.next()
    setDebugState(iterator.value)
    scrollPausePointIntoView()
  }

  React.useEffect(onStart, [])
  const scrollPausePointIntoView = () => {
    setTimeout(() => {
      const token = document.querySelector('glurr-app source-token[current]')
      if (token) token.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  return el('debug-view', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'auto auto auto auto',
      gridTemplateRows: 'auto 300px'
    }
  },
    el('style', {}, `
      glurr-app debug-view {
        display: flex;
      }
      glurr-app debug-view .toolbar {
        display: flex; align-items: center; grid-column: 1 / span 4;
        & > span { margin-right: auto; padding-left: 10px }
      }
      glurr-app debug-source {
        display: block;
        overflow-y: auto;
      }
      glurr-app stack-view {
        box-sizing: border-box;
        display: flex;
        width: 100px;
        height: 300px;
        overflow-y: auto;
        flex-direction: column;
        border-left: 2px solid black;
        border-top: 2px solid black;
        gap: 2px;
        padding: 2px;
        font-family: 'Monaco', monospace;
        font-size: 12px;
      }
      glurr-app stack-view source-token {
        border: 1px solid black;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      glurr-app source-token {
        display: inline-block;
        padding: 0px 2px;
        border: 1px solid transparent;
        border-radius: 4px;
      }
      glurr-app source-token[current] {
        background: black;
        color: white;
      }
      glurr-app source-token[breakpoint] {
        border: 1px solid black;
      }`),
    el('div', { class: 'toolbar' },
      el('span', {}, `Debugger paused at ${debugState?.index}`),
      el('button', { className: 'btn', onClick: onResume }, 'Resume'),
      el('button', { className: 'btn', onClick: onStepOver }, 'Step over'),
      el('button', { className: 'btn', onClick: onStep }, 'Step'),
      el('button', { className: 'btn', onClick: onStop }, 'Stop'),
    ),
    el('debug-source', { class: 'source', style: { width: 300 } },
      debugState?.tokenObjs.map((e, i) => el(React.Fragment, {},
        e.first && i > 0 ? el('br', {}) : null,
        el('source-token', {
          title: `token ${i}`,
          onClick: () => {
            if (breakpoints.includes(i)) setBreakpoints(s=>s.filter(e => e!=i))
            else setBreakpoints(s => [...s, i])
          },
          current: i === debugState.index ? 'true' : undefined,
          breakpoint: breakpoints.includes(i) ? 'true' : undefined,
        }, e.token == '' ? '' : e.token)
      ))
    ),
    el('stack-view', {},
      el('div', {}, 'Stack'),
      debugState?.stack.map(e => el('source-token', {}, el(Token, { value:e })))
    ),
    el('stack-view', {},
      el('div', {}, 'Control stack'),
      debugState?.ctrl.map(e => el('source-token', {}, el(Token, { value:e })))
    ),
    el('stack-view', {},
      el('div', {}, 'Variables'),
      Object.entries(debugState?.vars || {}).map(([k, v]) => el('source-token', {}, `${k}: ${v}`))
    ),
  )
}

function Token({ value }) {
  if ('string' == typeof value) return JSON.stringify(value)
  if ('boolean' == typeof value) return JSON.stringify(value)
  if (value >= JUMP_OFFSET) return `Jump to ${value - JUMP_OFFSET}`
  return value
}
