import { el, App, useEvent } from './assets/system.js'

export const app = new App('Lunar', Lunar, 'globe.svg')
app.addToAppMenu({ title: 'Restart', event: 'restart' })

export function Lunar() {
  const hostRef = React.useRef()
  const engineRef = React.useRef()

  useEvent(app, 'restart', () => {
    engineRef.current?.dispose()
    init()
  })

  const init = async () => {
    try {
      const { Engine } = await import('./lunar/Engine.js')
      const fragmentSrc = await (await fetch('/lunar/fragment.glsl')).text()
      const vertexSrc = await (await fetch('/lunar/vertex.glsl')).text()
      engineRef.current = new Engine(hostRef.current, vertexSrc, fragmentSrc)
      engineRef.current.start()
    } catch (err) {
      app.trigger('app:error', err)
      console.error(err)
    }
  }

  React.useEffect(() => {
    if (hostRef.current) init()
    return () => engineRef.current?.dispose()
  }, [hostRef.current])

  return el('canvas', {
    width: 1000,
    height: 750,
    style: { width: 500, height: 375 },
    ref: hostRef
  })
}
