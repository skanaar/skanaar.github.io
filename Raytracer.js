// vectors as [x,y,z] tuples = 4534ms to render a simple scene
// vectors as {x,y,z} objects = 736ms to render a simple scene

import { el, App, useEvent } from './assets/system.js'
import {
  FloydSteinbergDitherer,
  HilbertDitherer,
  NoiseDitherer,
  NoDitherer } from './raytracer/dither.js'
import {
  offsetMesh,
  rotateMesh,
  scaleMesh,
  wave,
  Plane,
  Sphere,
  Light
} from './raytracer/geometry.js'
import { Vec, norm, rnd } from './raytracer/math.js'
import { raytrace } from './raytracer/raytrace.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg', [256, 256], 'autosize')

app.addToAppMenu({ title: 'Toggle debug', event: 'debug' })

app.addMenu(
  'Scene',
  { title: 'Add light', event: 'add_light' },
  { title: 'Remove light', event: 'remove_light' },
  { title: null },
  { title: 'Add sphere', event: 'add_spheres', arg: 1 },
  { title: 'Add many spheres', event: 'add_spheres', arg: 5 },
  { title: 'Reset scene', event: 'reset_scene' },
)

app.addMenu(
  'Dither',
  { title: 'Floyd-Steinberg dither', event: 'dither', arg: 'floydsteinberg' },
  { title: 'Hilbert curve dither', event: 'dither', arg: 'hilbert' },
  { title: 'Noise dither', event: 'dither', arg: 'noise' },
  { title: 'No dither', event: 'dither', arg: 'none' },
)

let debug = true
let size = 256
let ditherMethod = 'floydsteinberg'

let lights = [
  Light(Vec(32, 32, -256+32), 4),
  Light(Vec(200, 50, 128), 100),
]
let spheres = [
  Sphere(Vec(32, 32, -256+32), 8),
  Sphere(Vec(128+64, 128, 0), 32),
]
let planes = [
  Plane(Vec(0,0,0), norm(Vec(1,0,0.01))),
  Plane(Vec(0,0,0), norm(Vec(0,1,0.01))),
  Plane(Vec(0,255,0), norm(Vec(0,-1,0.01))),
  Plane(Vec(255,0,0), norm(Vec(-1,0,0.01))),
  Plane(Vec(0,0,-255), norm(Vec(0,0,1.01))),
]
let triangles = offsetMesh(Vec(0,210,128), rotateMesh(Vec(3,0,0), scaleMesh(1, [
  ...wave({ res: 10, size: 256, periods: 3, height: 40 })
])))

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event, app) => {
    action(arg, event)

    let ditherer = {
      floydsteinberg: new FloydSteinbergDitherer(),
      hilbert: new HilbertDitherer(),
      noise: new NoiseDitherer(),
      none: new NoDitherer(),
    }[ditherMethod]

    raytrace({
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

  useEvent(app, 'add_light', apply(() => lights.push(Vec(rnd(1256)-500, rnd(1256)-500, 500))))
  useEvent(app, 'remove_light', apply(() => lights.pop()))
  useEvent(app, 'add_spheres', apply((count) => {
    for (let i = 0; i < count; i++)
      spheres.push([Vec(rnd(size), rnd(size), -256+rnd(size)), 32+rnd(32)])
  }))
  useEvent(app, 'reset_scene', apply(() => {
    spheres = [Sphere(Vec(128, 128, 0), 64)]
    lights = [Vec(200, 50, 128)]
  }))
  useEvent(app, 'dither', apply((value) => { ditherMethod = value }))
  useEvent(app, 'debug', apply((value) => { debug = !debug }))

  return el('canvas', { width: size, height: size, ref: hostRef })
}
