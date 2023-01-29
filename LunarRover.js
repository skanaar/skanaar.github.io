import { el, App } from './assets/system.js'

export const app = new App('LunarRover', LunarRover, 'cube.svg', [500, 375], 'noresize')

export function LunarRover() {
  const hostRef = React.useRef()
  React.useEffect(() => window.initLunarRover(hostRef.current), [])
  return el('div', {
    style: { margin: -10, width: 500, height: 375 },
    ref: hostRef
  })
}
