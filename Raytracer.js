import { el, App, useEvent } from './assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './raytracer/dither.js'
import {
  Plane,
  Sphere,
  Light,
  bezierMesh,
  wave,
} from './raytracer/geometry.js'
import {
  RotateX,
  RotateZ,
  Scale,
  Translate,
  Vec,
  matrixStack,
  norm
} from './raytracer/math.js'
import { raytraceParallel } from './raytracer/raytraceParallel.js'
import { teapotPatches } from './raytracer/teapot.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg')
app.addToAppMenu({
  title: 'Show options...',
  event: 'app:show_child_window',
  arg: 'Options'
})
app.addMenu(
  'Scene',
  { title: 'Teapot', event: 'scene', arg: 'teapot' },
  { title: 'Wave', event: 'scene', arg: 'wave' },
)
app.addMenu(
  'Reflections',
  { title: 'Enable reflections', event: 'maxdepth', arg: 3 },
  { title: 'No reflections', event: 'maxdepth', arg: 0 },
)
app.addMenu(
  'Dither',
  { title: 'Floyd-Steinberg dither', event: 'dither', arg: 'floydsteinberg' },
  { title: 'No dither', event: 'dither', arg: 'none' },
)
app.addWindow('Options', RenderOptions, {
  visible: true,
  offset: [256+20,0],
  size: [200,100]
})

let size = 256
let ditherMethod = 'floydsteinberg'
let maxDepth = 3

let lights = [
  Light(Vec(32, 32, -256+32), 16),
  Light(Vec(200, 50, 128), 150),
]
let spheres = []
let planes = [
  Plane(Vec(0,0,0), norm(Vec(1,0,0.01))),
  Plane(Vec(0,0,0), norm(Vec(0,1,0.01))),
  Plane(Vec(0,255,0), norm(Vec(0,-1,0.01))),
  Plane(Vec(255,0,0), norm(Vec(-1,0,0.01))),
  Plane(Vec(0,0,-255), norm(Vec(0,0,1.01))),
]
let triangles = []

function setSceneTeapot() {
  spheres = [
    Sphere(Vec(128+50, 128-50, -120), 64, 'mirror'),
  ]
  triangles = bezierMesh(
    teapotPatches,
    3,
    matrixStack(
      Translate(120,256,-80),
      Scale(40,40,40),
      RotateX(1.5),
      RotateZ(0.5)
    )
  )
}

function setSceneWave() {
  spheres = [
    Sphere(Vec(128, 80, 0), 32, 'diffuse'),
    Sphere(Vec(128, 148, 0), 8, 'diffuse'),
  ]
  triangles = wave(
    { res: 20, size: 256, periods: 3, height: 40 },
    matrixStack(Translate(0,220,128), RotateX(3), RotateZ(0))
  )
}

setSceneTeapot()

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event) => {
    action(arg, event)

    let ditherer = {
      floydsteinberg: new FloydSteinbergDitherer(),
      none: new NoDitherer(),
    }[ditherMethod]

    raytraceParallel({
      canvas: hostRef.current,
      size,
      maxDepth,
      scene: { spheres, planes, triangles, lights },
      ditherer,
    }).then((result) => app.trigger('done', result))
  }
  let render = apply(() => null)

  React.useEffect(() => {
    render()
  }, [])

  useEvent(app, 'scene', apply((arg) => {
    if (arg == 'wave') setSceneWave()
    else if (arg == 'teapot') setSceneTeapot()
  }))
  useEvent(app, 'dither', apply((arg) => { ditherMethod = arg }))
  useEvent(app, 'maxdepth', apply((arg) => { maxDepth = arg }))

  return el('canvas', { width: size, height: size, ref: hostRef })
}

function RenderOptions() {
  const [reflections, setReflections] = React.useState(maxDepth)
  const [dither, setDither] = React.useState(ditherMethod)
  const [duration, setDuration] = React.useState(0)
  useEvent(app, 'maxdepth', (arg) => setReflections(arg))
  useEvent(app, 'dither', (arg) => setDither(arg))
  useEvent(app, 'done', (arg) => setDuration(arg.duration))

  return el(
    'div',
    { style: { display: 'flex', flexDirection: 'column', margin: 10 } },
    el('label', {},
      el('input', {
        type: 'checkbox',
        checked: reflections > 0,
        onChange: (e) => app.trigger('maxdepth', e.target.checked ? 3 : 0),
      }),
      'Reflections'
    ),
    el('label', {},
      el('input', {
        type: 'checkbox',
        checked: dither == 'floydsteinberg',
        onChange: (e) => {
          app.trigger('dither', e.target.checked ? 'floydsteinberg' : 'none')
        },
      }),
      'Dither'
    ),
    `Duration: ${duration.toFixed(0)}ms`
  )
}
