import { el, App, useEvent } from './assets/system.js'
import { start as initLunarRover } from './lunar-rover/script.js'

export const app = new App('LunarRover', LunarRover, 'planet.svg', [500, 375], 'noresize')

app.addMenu(
  'View',
  { title: 'Toggle dithering', event: 'dither' },
  { title: 'Toggle overview', event: 'overview' },
  { title: null },
  { title: 'Pause / play', event: 'pause' }
)

let conf = null

export function LunarRover() {
  const hostRef = React.useRef()

  React.useEffect(() => { conf = initLunarRover(hostRef.current) }, [])

  useEvent(app, 'dither', () => { conf.isTwoTone = !conf.isTwoTone })
  useEvent(app, 'overview', () => { conf.showOverview = !conf.showOverview })
  useEvent(app, 'pause', () => { conf.isPaused = !conf.isPaused })

  return el('div', {
    style: { margin: -10, width: 500, height: 375 },
    ref: hostRef
  })
}
