import { el, App, useEvent } from './assets/system.js'

export const app = new App('Lunar', Lunar, 'moon.svg')
app.addToAppMenu({ title: 'Restart', event: 'restart' },{
  title: 'Show debug data',
  event: 'show_child_window',
  arg: 'Debug info'
})
app.addWindow('Debug info', DebugInfo, {
  visible: true,
  offset: [500+20,0],
  size: [200,100]
})

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
      engineRef.current.onDebugData = (data) => app.trigger('debug-data', data)
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

function DebugInfo() {
  const [data, setData] = React.useState(null)
  const [i, seti] = React.useState(0)
  useEvent(app, 'debug-data', (data) => setData(data))
  if (!data) return null
  return el('div', {
    className: 'padded',
    style: { fontFamily: 'monospace', whiteSpace: 'pre', width: 250 }
  },
    el(MetricVector, { label: 'pos     ', value: data.pos }),
    el(MetricVector, { label: 'force   ', value: data.force }),
    el(MetricVector, { label: 'dir     ', value: data.dir }),
    el(MetricVector, { label: 'vel     ', value: data.vel }),
    el('div', {}, `forward:   ${Math.atan2(data.forward[2], data.forward[0])}`),
    el('div', {}, `gas:       ${data.driveDirection}`),
    el('div', {}, `rotation:  ${data.rotation.toFixed(2)}`),
    el('div', {}, `turnAngle: ${data.turnAngle.toFixed(2)}`),
    el('div', {}, `touching:  ${JSON.stringify(data.isTouching)}`),
  )
}

function MetricVector({ label, value }) {
  const [x,y,z] = value
  return el('div', {},
    `${label}: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`
  )
}
