import { el, App } from './assets/system.js'
import { start as initLunarRover } from './lunar-rover/script.js'

export const app = new App('LunarRover', LunarRover, 'planet.svg', [500, 375], 'noresize')

export function LunarRover() {
  const hostRef = React.useRef()
  React.useEffect(() => initLunarRover(hostRef.current), [])
  return el('div', {
    style: { margin: -10, width: 500, height: 375 },
    ref: hostRef
  })
}
