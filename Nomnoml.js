import { el, App, useEvent } from './assets/system.js'
import { useScript } from './assets/useScript.js'

export const app = new App('Nomnoml', Nomnoml, 'nomnoml.svg')
app.resizable([600, 350])
app.addToAppMenu({ title: 'Visit nomnoml.com', event: 'visit-site' })
app.addAbout(About, { offset: [610,0], visible: true })

function Nomnoml() {
  const [source, setSource] = React.useState(defaultSource)
  const canvasRef = React.useRef()
  let statusGraphre = useScript('//unpkg.com/graphre/dist/graphre.js')
  let statusNomnoml = useScript(statusGraphre === 'ready' ? '//unpkg.com/nomnoml/dist/nomnoml.js' : null)

  useEvent(app, 'visit-site', () => location.assign('https://nomnoml.com/'))

  React.useEffect(() => {
    if (statusNomnoml != 'ready' || statusGraphre != 'ready') return
    try {
      window.nomnoml.draw(canvasRef.current, preamble+source, 2)
    } catch (e) {
      // swallow compilation errors
    }
  }, [statusGraphre, statusNomnoml, source])

  const onChange = (e) => {
    if (statusNomnoml != 'ready' || statusGraphre != 'ready') return
    setSource(e.target.value)
  }

  return el('nomnoml-app', {},
    el('style', {}, css),
    el('textarea-host', {},
      el('textarea', { value: source, onChange }),
    ),
    el('canvas', { ref: canvasRef })
  )
}

function About() {
  return el('div', { className: 'padded', style: { maxWidth: 200 } },
    el('p', {}, `A tool for drawing UML diagrams based on a simple syntax.`),
    el('p', {}, `Try and edit the code on the left and watch the diagram change`)
  )
}

const preamble = `#fill: #fff
`

const defaultSource = `[<abstract>Marauder]<:--[Pirate]
[Pirate] - 0..7[mischief]
[<actor id=sailor>Jolly;Sailor]
[sailor]->[Pirate]
[sailor]->[rum]
[Pirate]-> *[rum|tastiness: Int|swig()]`

const css = `
nomnoml-app {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
nomnoml-app textarea-host {
  display: block;
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  padding: 4px;
}
nomnoml-app textarea {
  box-sizing: border-box;
  font-family: 'Monaco', monospace;
  height: 100%;
  width: 100%;
  border: 2px solid black;
  padding: 5px;
  line-height: 22px;
}
nomnoml-app canvas {
  max-width: 100%;
  max-height: 100%;
}
`
