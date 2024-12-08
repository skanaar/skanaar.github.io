import { el, App, useEvent } from './assets/system.js'

export const app = new App('LunarRover', LunarRover, 'moon.svg')
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

  React.useEffect(() => {
    const init = async () => {
      const { start, dispose } = await import('./lunar-rover/script.js')
      conf = start(hostRef.current)
      return () => dispose()
    }
    init()
  }, [])

  useEvent(app, 'dither', () => { conf.isTwoTone = !conf.isTwoTone })
  useEvent(app, 'overview', () => { conf.showOverview = !conf.showOverview })
  useEvent(app, 'pause', () => { conf.isPaused = !conf.isPaused })

  return el('div', {
    style: { width: 500, height: 375 },
    ref: hostRef
  })
}
