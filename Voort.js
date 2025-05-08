import { el, App, useEvent, useMenuState } from './assets/system.js'
import { interpret } from './voort/interpret.js'
import { complex, standardLibrary, main } from './voort/library.js'
import { testsuite } from './voort/test.js'

export const app = new App('Voort', Voort, 'voort.svg')
app.addAbout(About, { offset: [520,0], visible: true })
app.addToAppMenu({
  title: 'Show Output...',
  event: 'app:show_child_window',
  arg: 'Voort output',
  cmd: 'i',
})
app.addMenu(
  'Debug',
  { title: 'Trace disabled', event: 'debug', arg: false },
  { title: 'Trace execution', event: 'debug', arg: true },
)
app.addWindow('Voort output', Output, {
  visible: true,
  offset: [0,400],
  size: [200,100]
})
app.menuState = { debug: false }

function Voort() {
  const [source, setSource] = React.useState(main)
  const debug = useMenuState(app, 'debug')
  const onChange = (e) => setSource(e.target.value)
  const onRun = (e) => {
    app.trigger('clear-output')
    interpret(source, {
      files: {
        'std': standardLibrary,
        'complex': complex,
      },
      trace: debug,
      out: (val) => app.trigger('output', val),
    })
  }

  React.useEffect(testsuite, [])

  return el('voort-app', {},
    el('style', {}, css),
    el('div', { class: 'toolbar' },
      el('button', { className: 'btn', onClick: onRun }, 'Run'),
      el('select', {},
        el('option', {}, 'example'),
        el('option', {}, 'standard lib'),
        el('option', {}, 'math'),
      )
    ),
    el('textarea', { value: source, onChange, spellcheck: 'false' }),
  )
}

function About() {
  return el('div', { className: 'padded', style: { maxWidth: 200 } },
    el('p', {}, `Voort is a stack language inspired by Forth`),
    el('p', {}, `Mention values like "strings" and 762 (numbers) to put them on the stack.`),
    el('p', {}, `Consume these values with words like + and / and push the results to the stack.`),
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
voort-app textarea {
  box-sizing: border-box;
  font-family: 'Monaco', monospace;
  font-size: 12px;
  line-height: 18px;
  height: 300px;
  width: 500px;
  border: 2px solid black;
  margin: -2px;
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
  padding: 5px;
}
`
