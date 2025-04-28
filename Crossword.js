import { el, App, useEvent, Button } from './assets/system.js'
import { CrosswordGenerator } from './crossworder/CrosswordGenerator.js'
import { wordlist } from './crossworder/english.js'
import { ordlista } from './crossworder/svenska.js'

export const app = new App('Crossword', Crossword, 'crossword.svg')
app.addAbout(About)
app.addWindow('Toolbox', Toolbox, {
  visible: true,
  offset: [280,-30],
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

function useMenuState(app, name) {
  const [val, setVal] = React.useState(app.menuState[name])
  useEvent(app, name, (arg) => {
    app.check(name, arg)
    setVal(arg)
  })
  return val
}

function Crossword() {
  const engine = React.useRef(null)
  const displayHost = React.useRef(null)
  const size = useMenuState(app, 'size')
  const lang = useMenuState(app, 'lang')
  const [dict, setDict] = React.useState([])
  React.useEffect(() => {
    engine.current = new CrosswordGenerator({
      onRender: (svg, score) => {
        displayHost.current.innerHTML = svg
        app.trigger('generated', { score })
      }
    })
  }, [])
  React.useEffect(() => {
    engine?.current.generate(size, [0,0], 1, lang, dict)
  }, [size, lang, dict])
  useEvent(app, 'generate', (arg) => setDict(arg.words))

  return el('div', {
    ref: displayHost,
    style: { padding: 10, width: size * 25 } })
}

function Toolbox() {
  const [words, setWords] = React.useState([])
  const [score, setScore] = React.useState(null)
  useEvent(app, 'generated', (arg) => {
    setScore(arg.score)
  })

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
    el(Button,
      { onClick: () => app.trigger('generate', {words: words.filter(e => e)}) },
      'Generate'
    ),
    el('div', { style: { marginTop: 5 } },
      el('span', {}, 'Score: ', score)
    ),
  )
}

function About() {
  return el('div', { className: 'padded', style: { maxWidth: 200 } },
    el('p', {}, 'Crossword generator')
  )
}
