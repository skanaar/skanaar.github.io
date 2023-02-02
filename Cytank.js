import { el, App } from './assets/system.js'
import { start } from './cytank/js/engine.js'

export const app = new App('Cytank', Cytank, 'joystick.svg', [800, 400], 'noresize')

export function Cytank() {
  const hostRef = React.useRef()

  React.useEffect(() => {
    start(hostRef.current)
  }, [])

  return el('canvas', {
    width: 800,
    height: 400,
    style: { margin: -10 },
    ref: hostRef
  })
}
