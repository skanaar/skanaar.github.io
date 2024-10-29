import { el, App, useEvent } from './assets/system.js'

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
app.addMenu(
  'Dither',
  { title: 'Small dither', event: 'ditherS' },
  { title: 'Medium dither', event: 'ditherM' },
  { title: 'Large dither', event: 'ditherL' },
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
  useEvent(app, 'ditherS', apply(() => { dither = ditherS }))
  useEvent(app, 'ditherM', apply(() => { dither = ditherM }))
  useEvent(app, 'ditherL', apply(() => { dither = ditherL }))

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

let ditherS = [0.17, 0.75, 0.43, 0.55, 0.56, 0.70, 0.88]
let ditherM = [0.14, 0.07, 0.21, 0.26, 0.17, 0.67, 0.55, 0.65, 0.06, 0.51, 0.10, 0.66, 0.91, 0.76]
let ditherL = new Array(137).fill(1).map(() => Math.random())
let dither = ditherS

function raytrace(canvas, w, spheres, lights) {
  let ctx = canvas.getContext("2d")
  let ditherIndex = 0
  let buffer = []
  for (let i = 0; i < w; i++)
    for (let j = 0; j < w; j++) {
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
      ditherIndex = (ditherIndex + 1) % dither.length
      ctx.fillStyle = dither[ditherIndex] < bright ? `#fff` : '#000'
      ctx.fillRect(i, j, 1, 1)
    }
}

function lightBrightness(p, surface_normal, light) {
  let light_dir = norm(diff(light, p))
  let dist = mag(diff(p, light))
  let intensity = 200000/sq(dist)
  return Math.max(0, intensity * dot(surface_normal, light_dir))
}
