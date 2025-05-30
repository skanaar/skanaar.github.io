import { el, App, useEvent, useMenuState } from './assets/system.js'
import { Debugger } from './voort/Debugger.js'
import { interpret } from './voort/interpret.js'
import { complex, standardLibrary, main } from './voort/library.js'
import { testsuite } from './voort/test.js'

export const app = new App('Voort', Voort, 'voort.svg')
app.addAbout(About, { offset: [520,0], visible: false })
app.addToAppMenu({
  title: 'Show Output...',
  event: 'app:show_child_window',
  arg: 'Voort output',
  cmd: 'i',
})
app.addWindow('Voort output', Output, {
  visible: true,
  offset: [0,400],
  size: [200,100]
})
app.menuState = { debug: false }

const files = {
    std: standardLibrary,
    complex: complex,
    main: main
}

function Voort() {
  const [mode, setMode] = React.useState('run')
  const [source, setSource] = React.useState(main)
  const [line, setLine] = React.useState(0)
  const textareaRef = React.useRef()
  const onChange = (e) => setSource(e.target.value)
  const onRun = () => {
    app.trigger('clear-output')
    setMode('run')
    interpret(source, {
      files: files,
      out: (val) => app.trigger('output', val),
    })
  }
  const onDebug = () => {
    app.trigger('clear-output')
    setMode('debug')
  }

  React.useEffect(testsuite, [])
  React.useEffect(() => {
    let onEvent = e => {
      setLine(source.substring(0, e.target.selectionStart).split('\n').length)
    }
    textareaRef.current?.addEventListener('selectionchange', onEvent)
    return () => {
      textareaRef.current?.removeEventListener('selectionchange', onEvent)
    }
  }, [textareaRef.current])

  if (mode == 'debug')
    return el('voort-app', {},
      el('style', {}, css),
      el(Debugger, { app, source, files, onStop: () => setMode('run') })
    )

  return el('voort-app', {},
    el('style', {}, css),
    el('div', { class: 'toolbar' },
      el('select', { onChange: (e) => setSource(files[e.target.value])},
        el('option', { value: 'main' }, 'main'),
        el('option', { value: 'std' }, 'std'),
        el('option', { value: 'complex' }, 'complex'),
      ),
      el('span', { style: { marginRight: 'auto' } }, `Line ${line}`),
      el('button', { className: 'btn', onClick: onRun }, 'Run'),
      el('button', { className: 'btn', onClick: onDebug }, 'Debug'),
    ),
    el('textarea', {
      value: source,
      spellcheck: 'false',
      onChange,
      ref: textareaRef,
    })
  )
}

function About() {
  return el('div', { className: 'padded', style: { maxWidth: 200 } },
    el('p', {}, `Voort is a stack language inspired by Forth`),
    el('p', {}, `Mention values like "strings" and 762 (numbers) to put them on
      the stack.`),
    el('p', {}, `Consume these values with words like + and / and push the
      results to the stack.`),
    el('p', {}, `Inspect the stack with the word "..."`)
  )
}

function Output() {
  const [data, setData] = React.useState([])
  useEvent(app, 'clear-output', () => setData([]))
  useEvent(app, 'output', (data) => setData(s => [...s, data]))
  if (!data) return null
  return el('pre', { className: 'voort-console' }, data.join('\n'))
}

const css = `
voort-app {
  display: grid;
}
voort-app textarea, voort-app debug-view debug-source {
  box-sizing: border-box;
  font-family: 'Monaco', monospace;
  font-size: 12px;
  line-height: 18px;
  height: 300px;
  width: 500px;
  border: none;
  border-top: 2px solid black;
  padding: 10px;
  resize: none;
}
voort-app textarea:focus {
  outline: none;
}
.voort-console {
  display: block;
  border: 2px solid black;
  padding: 2px;
  margin: -2px;
  min-height: 4em;
  width: 500px;
}
voort-app .toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  gap: 5px;
}
voort-app .toolbar .btn {
  min-width: 80px;
}
voort-app debug-view {
  display: flex;
}
voort-app debug-view debug-source {
  display: block;
  overflow-y: auto;
}
voort-app debug-view stack-view {
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
voort-app debug-view stack-view source-token {
  border: 1px solid black;
}
voort-app debug-view source-token {
  display: inline-block;
  padding: 0px 2px;
  border: 1px solid transparent;
  border-radius: 4px;
}
voort-app debug-view source-token[current] {
  background: black;
  color: white;
}
voort-app debug-view source-token[breakpoint] {
  border: 1px solid black;
}
`
