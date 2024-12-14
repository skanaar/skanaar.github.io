import { el, App, useEvent } from './assets/system.js'
import { useFetch } from './assets/useFetch.js'

export const app = new App('Lunar', Lunar, 'globe.svg')

export function Lunar() {
  const hostRef = React.useRef()
  const engineRef = React.useRef()
  const [param, setParam] = React.useState(0)
  const { data: fragmentSrc } = useFetch('/lunar/fragment.glsl', 'text')
  const { data: vertexSrc } = useFetch('/lunar/vertex.glsl', 'text')

  React.useEffect(() => {
    const init = async () => {
      const { Engine } = await import('./lunar/Engine.js')
      engineRef.current = new Engine(hostRef.current, vertexSrc, fragmentSrc)
      engineRef.current.render(0)
    }
    if (hostRef.current && fragmentSrc && vertexSrc) {
      init().catch(err => {
        app.trigger('error', err)
        console.error(err)
      })
    }
    return () => engineRef.current?.dispose()
  }, [hostRef.current, fragmentSrc, vertexSrc])

  function hover(e) {
    if (engineRef.current) {
      engineRef.current.render(e.clientY/100, e.clientX/100)
    }
  }

  return el('canvas', {
    width: 1000,
    height: 750,
    style: { width: 500, height: 375 },
    onMouseMove: hover,
    ref: hostRef
  })
}
