import { el, App, useEvent } from './assets/system.js'
import { IconIpsum } from './icon-ipsum/IconIpsum.js'
import { seq } from './icon-ipsum/random.js'
import { templates } from './icon-ipsum/templates.js'

export const app = new App('Icon Ipsum', IconIpsumApp, 'icon-ipsum.svg')
app.resizable([256, 256])
app.addToAppMenu({ title: 'Visit npm package', event: 'visit-site' })
app.addAbout(About)
app.addMenu(
  'Template',
  { title: 'all', event: 'template', arg: undefined },
  ...templates.map((e) => ({ title: e.name, event: 'template', arg: e.name }))
)
app.addMenu(
  'Stroke',
  { title: 'Thin', event: 'stroke', arg: 1, cmd: '7' },
  { title: 'Medium', event: 'stroke', arg: 1.5, cmd: '8' },
  { title: 'Thick', event: 'stroke', arg: 2, cmd: '9' },
)

function IconIpsumApp() {
  const [, setTime] = React.useState(0)
  const [templateName, setTemplateName] = React.useState(undefined)
  const [stroke, setStroke] = React.useState(1)
  useEvent(app, 'visit-site', () => location.assign('https://www.npmjs.com/package/icon-ipsum'))
  useEvent(app, 'template', (arg) => setTemplateName(arg))
  useEvent(app, 'stroke', (arg) => setStroke(arg))

  const iconIpsum = new IconIpsum({ strokeWidth: stroke, width: 32, height: 32 })
  iconIpsum.seed(4711)

  React.useEffect(() => {
    const handle = setInterval(() => setTime(t => t+1), 3000)
    return () => clearInterval(handle)
  }, [])

  return el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 16, margin: 16 } },
    seq(25).map((i) =>
      el('div', { key: i, style: { width: 32, height: 32 }, dangerouslySetInnerHTML: { __html: iconIpsum.icon(templateName) } })
    )
  )
}

function About() {
  return el('div', { className: 'padded', style: { maxWidth: 200 } },
    el('p', {}, 'Lorem Ipsum is a library that generates randomized SVG icons')
  )
}
