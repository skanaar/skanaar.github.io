import { el, App, useEvent } from './assets/system.js'
import { hilbert } from './Hilbert.js'

let size = 256
export const app = new App('RayTracer', RayTracer, 'aperture.svg', [size, size], 'autosize')

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
  { title: 'Hilbert curve dither', event: 'dither-hilbert' },
  { title: 'Noise dither', event: 'dither-noise' },
  { title: 'No dither', event: 'dither-none' },
)

let ditherMethod = 'dither-hilbert'

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => () => {
    action()
    raytrace(hostRef.current, size, spheres, lights)
  }

  React.useEffect(() => {
    raytrace(hostRef.current, size, spheres, lights)
  }, [])

  useEvent(app, 'add_light', apply(() => { lights.push([rnd(1256)-500, rnd(1256)-500, 500]) }))
  useEvent(app, 'remove_light', apply(() => { lights.pop() }))
  useEvent(app, 'add_sphere', apply(() => { spheres.push([[rnd(), rnd(), rnd()], rnd(50)]) }))
  useEvent(app, 'add_spheres', apply(() => {
    for (let i = 0; i < 5; i++) spheres.push([[rnd(), rnd(), rnd()], rnd(50)])
  }))
  useEvent(app, 'reset_scene', apply(() => {
    spheres = [[[128, 128, 128], 64, [255, 0, 0]]]
    lights = [[512, 0, 512]]
  }))
  useEvent(app, 'dither-hilbert', apply(() => { ditherMethod = 'hilbert' }))
  useEvent(app, 'dither-noise', apply(() => { ditherMethod = 'noise' }))
  useEvent(app, 'dither-none', apply(() => { ditherMethod = 'none' }))

  return el('canvas', { width: size, height: size, ref: hostRef })
}

let rnd = (t = size) => t * Math.random()

let lights = [[512, 0, 512]]
let spheres = []
for (let i = 0; i < 32; i++)
  spheres.push([[rnd(), rnd(), rnd()], rnd(50)])

let add = ([a, b, c], [x, y, z]) => [a + x, b + y, c + z]
let diff = ([a, b, c], [x, y, z]) => [a - x, b - y, c - z]
let mult = (k, [a, b, c]) => [k*a, k*b, k*c]
let dot = ([a, b, c], [x, y, z]) => a * x + b * y + c * z
let mag = ([a, b, c]) => Math.sqrt(a * a + b * b + c * c)
let div = ([a, b, c], k) => [a / k, b / k, c / k]
let norm = (v) => div(v, mag(v))
let sq = (x) => x * x

function raytrace(canvas, size, spheres, lights) {
  let ctx = canvas.getContext("2d")
  let curve = hilbert([0, 0], [size-1, 0], size)
  let ditherer = {
    hilbert: new HilbertDiffusionDitherer(),
    noise: new NoiseDitherer(),
    none: { apply: (value) => value },
  }[ditherMethod]

  let camera = [128, 128, 512]

  for (let [i,j] of curve) {
    let camDir = norm(diff([i, j, 0], camera))
    let depth = 1000
    let bright = 0
    for (let [sphereOrigin, r] of spheres) {
      let a = dot(camDir, camDir)
      let b = 2 * dot(camDir, diff(camera, sphereOrigin))
      let c = dot(sphereOrigin, sphereOrigin) + dot(camera, camera) + -2*dot(sphereOrigin, camera) - r*r
      let disc = b*b - 4*a*c
      if (disc < 0) continue
      let t = (-b - Math.sqrt(b*b - 4*a*c))/(2*a)

      let p = add(camera, mult(t, camDir))
      if (t > depth) continue
      depth = t
      bright = 0
      for (let light of lights)
        bright += lightBrightness(p, mult(1/r, diff(p, sphereOrigin)), light)
    }

    ctx.fillStyle = toColor(ditherer.apply(bright))
    ctx.fillRect(i, j, 1, 1)
  }

  function toColor(value) {
    let c = Math.min(255, Math.max(0, value * 255))
    return `rgb(${c},${c},${c})`
  }
}

class HilbertDiffusionDitherer {
  cursor = 0
  errorBuffer = [0, 0, 0, 0, 0, 0, 0, 0]
  apply(value) {
    this.cursor = (this.cursor + 1) % this.errorBuffer.length
    let clamped = (value - this.errorBuffer[this.cursor]) > 0.5 ? 1 : 0
    let deviation = (clamped - value) / 8
    for (let n = 0; n < this.errorBuffer.length; n++)
      this.errorBuffer[n] += deviation
    this.errorBuffer[this.cursor] = 0
    return clamped
  }
}

class NoiseDitherer {
  cursor = 0
  noise = [0.17, 0.75, 0.43, 0.55, 0.56, 0.70, 0.88]
  apply(value) {
    this.cursor = (this.cursor + 1) % this.noise.length
    return (value > this.noise[this.cursor]) ? 1 : 0
  }
}

function lightBrightness(p, surface_normal, light) {
  let light_dir = norm(diff(light, p))
  let dist = mag(diff(p, light))
  let intensity = 200000/sq(dist)
  return Math.max(0, intensity * dot(surface_normal, light_dir))
}
