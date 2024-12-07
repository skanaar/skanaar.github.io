import { el, App, useEvent } from './assets/system.js'
import { renderScene } from './raymarcher/renderScene.js'
import { useFetch } from './raymarcher/useFetch.js'

export const app = new App('RayMarcher', RayMarcher, 'shader.svg')

function RayMarcher() {
  const hostRef = React.useRef()
  const { data: fragmentSource } = useFetch('/raymarcher/fragment.glsl', 'text')
  const { data: vertexSource } = useFetch('/raymarcher/vertex.glsl', 'text')

  React.useEffect(() => {
    if (!fragmentSource || !vertexSource) return
    let handle = 0
    function render(time) {
      renderScene(hostRef.current, vertexSource, fragmentSource, time/1000.)
      handle = requestAnimationFrame(render)
    }
    render(0)
    return () => cancelAnimationFrame(handle)
  }, [fragmentSource, vertexSource])

  return el('canvas', { width: 256, height: 256, ref: hostRef })
}
