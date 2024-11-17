import { el, App, useEvent } from './assets/system.js'
import { start } from './cytank/js/engine.js'

export const app = new App('Cytank', Cytank, 'joystick.svg')
app.addToAppMenu({ title: 'Pause/Play', event: 'play' })

export function Cytank() {
  const hostRef = React.useRef()
  const gameRef = React.useRef()

  useEvent(app, 'play', () => gameRef.current.isPaused = !gameRef.current.isPaused)

  React.useEffect(() => {
    gameRef.current = start(hostRef.current)
    return () => gameRef.current.dispose()
  }, [])

  return el('canvas', { width: 800, height: 400, ref: hostRef })
}
