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

export const app =
  new App('RayTracer', RayTracer, 'aperture.svg', [256, 256], 'autosize')

app.addToAppMenu({ title: 'Toggle debug', event: 'debug' })

app.addMenu(
  'Scene',
  { title: 'Teapot', event: 'scene_teapot' },
  { title: 'Wave', event: 'scene_wave' },
)

app.addMenu(
  'Dither',
  { title: 'Floyd-Steinberg dither', event: 'dither', arg: 'floydsteinberg' },
  { title: 'Hilbert curve dither', event: 'dither', arg: 'hilbert' },
  { title: 'No dither', event: 'dither', arg: 'none' },
)

let debug = false
let size = 256
let ditherMethod = 'floydsteinberg'

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

setSceneWave()

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event, app) => {
    action(arg, event)

    let ditherer = {
      floydsteinberg: new FloydSteinbergDitherer(),
      none: new NoDitherer(),
    }[ditherMethod]

    raytraceParallel({
      canvas: hostRef.current,
      size,
      spheres,
      planes,
      triangles,
      lights,
      ditherer,
      debug
    })
  }
  let render = apply(() => null)

  React.useEffect(() => {
    render()
  }, [])

  useEvent(app, 'scene_wave', apply(setSceneWave))
  useEvent(app, 'scene_teapot', apply(setSceneTeapot))
  useEvent(app, 'dither', apply((value) => { ditherMethod = value }))
  useEvent(app, 'debug', apply((value) => { debug = !debug }))

  return el('canvas', { width: size, height: size, ref: hostRef })
}
