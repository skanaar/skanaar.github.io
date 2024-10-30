import { el, App, useEvent } from './assets/system.js'
import { hilbert } from './Hilbert.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg', [256, 256], 'autosize')

app.addMenu(
  'Scene',
  { title: 'Add light', event: 'add_light' },
  { title: 'Remove light', event: 'remove_light' },
  { title: null },
  { title: 'Add sphere', event: 'add_sphere' },
  { title: 'Add many spheres', event: 'add_spheres' },
  { title: 'Reset scene', event: 'reset_scene' },
)

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => () => {
    action()
    raytrace(hostRef.current, w, spheres, lights)
  }

  React.useEffect(() => {
    raytrace(hostRef.current, w, spheres, lights)
  }, [])

  useEvent(app, 'add_light', apply(() => { lights.push([3*rnd(), 3*rnd(), 3*rnd()]) }))
  useEvent(app, 'remove_light', apply(() => { lights.pop() }))
  useEvent(app, 'add_sphere', apply(() => { spheres.push([[rnd(), rnd(), rnd()], rnd(50)]) }))
  useEvent(app, 'add_spheres', apply(() => {
    for (let i = 0; i < 5; i++) spheres.push([[rnd(), rnd(), rnd()], rnd(50)])
  }))
  useEvent(app, 'reset_scene', apply(() => {
    spheres = [[[128, 128, 128], 64, [255, 0, 0]]]
    lights = [[512, 0, 512]]
  }))

  return el('canvas', { width: 256, height: 256, ref: hostRef })
}

let rnd = (t = 255) => t * Math.random()

let w = 256
let lights = [[512, 0, 512]]
let spheres = []
for (let i = 0; i < 32; i++)
  spheres.push([[rnd(), rnd(), rnd()], rnd(50)])

let diff = ([a, b, c], [x, y, z]) => [a - x, b - y, c - z]
let dot = ([a, b, c], [x, y, z]) => a * x + b * y + c * z
let mag = ([a, b, c]) => Math.sqrt(a * a + b * b + c * c)
let div = ([a, b, c], k) => [a / k, b / k, c / k]
let norm = (v) => div(v, mag(v))
let sq = (x) => x * x

function raytrace(canvas, w, spheres, lights) {
  let ctx = canvas.getContext("2d")
  let curve = hilbert([0, 0], [255, 0], 256)
  let ditherIndex = 0
  let errorBuffer = [0, 0, 0, 0, 0, 0, 0 ,0]

  for (let [i,j] of curve) {
    let depth = -1000
    let bright = 0
    for (let [[x, y, z], r] of spheres) {
      if (sq(i - x) + sq(j - y) > r * r) continue
      let k = Math.sqrt(r * r - sq(i - x) - sq(j - y)) + z
      let p = [i, j, k]
      if (k < depth) continue
      depth = k
      bright = 0
      for (let e of lights)
        bright += lightBrightness(p, norm(diff(p, [x, y, z])), e)
    }
    ditherIndex = (ditherIndex + 1) % errorBuffer.length
    let clampedBright = (bright - errorBuffer[ditherIndex]) > 0.5 ? 1 : 0
    let deviation = (clampedBright - bright) / 8
    for (let n = 0; n < errorBuffer.length; n++) errorBuffer[n] += deviation
    errorBuffer[ditherIndex] = 0
    ctx.fillStyle = clampedBright === 1 ? `#fff` : '#000'
    ctx.fillRect(i, j, 1, 1)
  }
}

function lightBrightness(p, surface_normal, light) {
  let light_dir = norm(diff(light, p))
  let dist = mag(diff(p, light))
  let intensity = 200000/sq(dist)
  return Math.max(0, intensity * dot(surface_normal, light_dir))
}
