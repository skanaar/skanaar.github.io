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
    const state = debugIterator.next()
    setDebugState(state.value)
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
    el('div', {
      class: 'toolbar',
      style: { display: 'flex', alignItems: 'center', gridColumn: '1 / span 4' }
    },
      el('span', { style: { marginRight: 'auto', paddingLeft: 10 } },
        mode === 'paused'
        ? `Debugger paused at ${debugState?.index}`
        : `Debugger ${mode}`
      ),
      mode == 'paused'
        && el('button', { className: 'btn', onClick: onResume }, 'Resume'),
      mode == 'paused'
        && el('button', { className: 'btn', onClick: onStep }, 'Step'),
      el('button', { className: 'btn', onClick: onStop }, 'Stop'),
    ),
    el('debug-source', { style: { width: 300 } },
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
        }, e.token)
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
