import { el, App, useEvent, Button } from './assets/system.js'
import { CrosswordGenerator } from './crossworder/CrosswordGenerator.js'

export const app = new App('Crossword', Crossword, 'crossword.svg')
app.resizable([256, 256])
app.addAbout(About)
app.addWindow('Toolbox', Toolbox, {
  visible: true,
  offset: [276,0],
  size: [200,200]
})
app.addMenu(
  'Size',
  { title: '10 x 10', event: 'size', arg: 10 },
  { title: '15 x 15', event: 'size', arg: 15 },
)
app.addMenu(
  'Language',
  { title: 'Swedish word list', event: 'lang', arg: 'sv' },
  { title: 'English word list', event: 'lang', arg: 'en' },
)
app.menuState = { size: 10, lang: 'en' }

function Crossword() {
  const engine = React.useRef(null)
  const displayHost = React.useRef(null)
  React.useEffect(() => {
    engine.current = new CrosswordGenerator({
      onRender: (svg) => displayHost.current.innerHTML = svg
    })
    engine.current.generate(10, [0,0], 1, 'en', [])
  }, [])
  useEvent(app, 'size', (arg) => app.check('size', arg))
  useEvent(app, 'lang', (arg) => app.check('lang', arg))
  useEvent(app, 'generate', (arg) => {
    console.log('generate', arg)
    engine.current.generate(
      app.menuState.size, [0,0], 1, app.menuState.lang, arg.words.filter(e => e)
    )
  })

  return el('div', { ref: displayHost, style: { padding: 10 } })
}

function Toolbox() {
  const [words, setWords] = React.useState([])

  return el('div', { className: 'padded' },
    el('span', {}, 'Custom words'),
    el('textarea', {
      onChange: (e) => {
        setWords(e.target.value.split('\n'))
      },
      value: words.join('\n'),
      style: {
        display: 'block',
        boxSizing: 'border-box',
        fontFamily: "'Monaco', monospace",
        height: 150,
        width: 150,
        border: '2px solid black',
        padding: 5,
        margin: '5px 0',
        lineHeight: '22px',
      }
    }),
    el(Button, { onClick: () => app.trigger('generate', {words}) }, 'Generate'),
  )
}

function About() {
  return el('div', { className: 'padded', style: { maxWidth: 200 } },
    el('p', {}, 'Crossword generator')
  )
}
