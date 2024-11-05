// vectors as [x,y,z] tuples = 4534ms to render a simple scene
// vectors as {x,y,z} objects = 736ms to render a simple scene

import { el, App, useEvent } from './assets/system.js'
import { hilbert } from './Hilbert.js'

let EPSILON = 0.001
let debug = false

let size = 256
export const app = new App('RayTracer', RayTracer, 'aperture.svg', [size, size], 'autosize')

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

let ditherMethod = 'floydsteinberg'

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event, app) => {
    action(arg, event)
    raytrace(hostRef.current, size, spheres, lights)
  }

  React.useEffect(() => {
    raytrace(hostRef.current, size, spheres, lights)
  }, [])

  useEvent(app, 'add_light', apply(() => lights.push(Vec(rnd(1256)-500, rnd(1256)-500, 500))))
  useEvent(app, 'remove_light', apply(() => lights.pop()))
  useEvent(app, 'add_spheres', apply((count) => {
    for (let i = 0; i < count; i++)
      spheres.push([Vec(rnd(), rnd(), -256+rnd()), 32+rnd(32)])
  }))
  useEvent(app, 'reset_scene', apply(() => {
    spheres = [[Vec(128, 128, -128), 64]]
    lights = [Vec(200, 50, 128)]
  }))
  useEvent(app, 'dither', apply((value) => { ditherMethod = value }))
  useEvent(app, 'debug', apply((value) => { debug = !debug }))

  return el('canvas', { width: size, height: size, ref: hostRef })
}

let Vec = (x, y, z) => ({ x, y, z })
let add = (a, b) => Vec(a.x + b.x, a.y + b.y, a.z + b.z)
let diff = (a, b) => Vec(a.x - b.x, a.y - b.y, a.z - b.z)
let mult = (k, vec) => Vec(k*vec.x, k*vec.y, k*vec.z)
let dot = (a,b) => a.x*b.x + a.y*b.y + a.z*b.z
let cross = (a, b) => Vec(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x)
let mag = (vec) => Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z)
let div = (vec, k) => Vec(vec.x / k, vec.y / k, vec.z / k)
let norm = (v) => div(v, mag(v))
let rotx = (a, { x, y, z }) => Vec(x, Math.cos(a)*y - Math.sin(a)*z, Math.sin(a)*y + Math.cos(a)*z)
let sq = (x) => x * x
let clamp = (x, low, high) => Math.max(low, Math.min(x, high))
let rnd = (t = size) => t * Math.random()

function wave(res, scale, periods) {
  let point = (i,j) => Vec(
    scale*i,
    scale*Math.cos(periods*3.14*2*(Math.sqrt(sq((i-res/2)/res)+sq((j-res/2)/res)))),
    scale*j,
  )
  return [...generateRowByRowCoordinates(res)].flatMap(([i,j]) => [
    [point(i,j), point(i+1,j), point(i,j+1)],
    [point(i+1,j), point(i+1,j+1), point(i,j+1)],
  ])
}

let lights = [Vec(200, 50, 128)]
let spheres = []
let planes = [
  [Vec(0,0,0), norm(Vec(1,0,0.01))],
  [Vec(0,0,0), norm(Vec(0,1,0.01))],
  [Vec(0,255,0), norm(Vec(0,-1,0.01))],
  [Vec(255,0,0), norm(Vec(-1,0,0.01))],
  [Vec(0,0,-255), norm(Vec(0,0,1.01))],
]
let triangles = offsetTriangles(Vec(20,200,100), rotateXTriangles(3.0, scaleTriangles(1, [
  //[[1,0,0],[0,0,1],[0,1,0]],
  //[[-1,0,0],[0,0,1],[0,1,0]],
  //[[1,0,0],[0,0,-1],[0,1,0]],
  //[[-1,0,0],[0,0,-1],[0,1,0]],
  //[[1,0,0],[0,0,1],[0,-1,0]],
  //[[-1,0,0],[0,0,1],[0,-1,0]],
  //[[1,0,0],[0,0,-1],[0,-1,0]],
  //[[-1,0,0],[0,0,-1],[0,-1,0]],

  //[[0,0,1],[1,0,0],[0,1,0]],
  //[[0,0,1],[-1,0,0],[0,1,0]],
  //[[0,0,-1],[1,0,0],[0,1,0]],
  //[[0,0,-1],[-1,0,0],[0,1,0]],
  //[[0,0,1],[1,0,0],[0,-1,0]],
  //[[0,0,1],[-1,0,0],[0,-1,0]],
  //[[0,0,-1],[1,0,0],[0,-1,0]],
  //[[0,0,-1],[-1,0,0],[0,-1,0]],

  ...wave(10, 20, 3)
])))

for (let i = 0; i < 5; i++)
  spheres.push([Vec(rnd(), rnd(), -256+rnd()), 32+rnd(32)])

function offsetTriangles(v, triangles) {
  return triangles.map(([a,b,c]) => [add(a, v), add(b, v), add(c, v)])
}
function scaleTriangles(k, triangles) {
  return triangles.map(([a,b,c]) => [mult(k, a), mult(k, b), mult(k, c)])
}
function rotateXTriangles(rot, triangles) {
  return triangles.map(([a,b,c]) => [rotx(rot,a), rotx(rot,b), rotx(rot,c)])
}

function bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p]) {
}
function bezier3D([a,b,c,d], t) {
  return Vec(
    bezier1D(a.x, b.x, c.x, d.x, t),
    bezier1D(a.y, b.y, c.y, d.y, t),
    bezier1D(a.z, b.z, c.z, d.z, t),
  )
}
function bezier1D([a,b,c,d], t) {
  let u = 1-1
  return u*u*u*a + 3*u*u*t*b +3*u*t*t*c + t*t*t*d
}

function raytrace(canvas, size, spheres, lights) {
  let ctx = canvas.getContext("2d")
  let ditherer = {
    floydsteinberg: new FloydSteinbergDiffusionDitherer(),
    hilbert: new HilbertDiffusionDitherer(),
    noise: new NoiseDitherer(),
    none: new NoDitherer(),
  }[ditherMethod]

  let camera = Vec(128, 128, 512)

  let start = performance.now()
  for (let [i,j] of ditherer.coordinates(size)) {
    let camdiff = diff(Vec(i, j, 0), camera)
    let camdist = mag(camdiff)
    let camDir = norm(camdiff)
    let hit = { depth: 1000, normal: null, point: Vec(0,0,0) }

    // sphere intersections
    for (let [sphereOrigin, r] of spheres) {
      let a = dot(camDir, camDir)
      let b = 2 * dot(camDir, diff(camera, sphereOrigin))
      let c = dot(sphereOrigin, sphereOrigin) + dot(camera, camera) + -2*dot(sphereOrigin, camera) - r*r
      let disc = b*b - 4*a*c
      if (disc < 0) continue
      let t = (-b - Math.sqrt(b*b - 4*a*c))/(2*a)
      if (t > hit.depth) continue
      let p = add(camera, mult(t, camDir))
      hit = { depth: t, normal: mult(1/r, diff(p, sphereOrigin)), point: p }
    }

    // plane intersections
    for (let [planeOrigin, normal] of planes) {
      if (dot(camDir, normal) > 0) continue
      let t = (dot(planeOrigin,normal) - dot(camera,normal)) / dot(camDir,normal)
      if (t > hit.depth) continue
      hit = { depth: t, normal, point: add(camera, mult(t, camDir)) }
    }

    // triangle intersections
    for (let [a,b,c] of triangles) {
      let normal = norm(cross(diff(c,a), diff(b,a)))
      let denominator = dot(camDir,normal)
      if (denominator > 0) continue
      if (-denominator < EPSILON) continue
      let t = (dot(a,normal) - dot(camera,normal)) / denominator
      if (t > hit.depth) continue
      const p = add(camera, mult(t, camDir))
      // is p outside triangle?
      let to_a = cross(diff(c,b), normal)
      let to_b = cross(diff(a,c), normal)
      let to_c = cross(diff(b,a), normal)
      if (dot(diff(p,b), to_a) < 0) continue
      if (dot(diff(p,c), to_b) < 0) continue
      if (dot(diff(p,a), to_c) < 0) continue
      hit = { depth: t, normal, point: p }
    }

    // hit patch illumination
    let bright = 0
    if (hit.normal != null)
      for (let light of lights)
        bright += lightBrightness(hit.point, hit.normal, light)
    bright = clamp(bright, 0, 1)
    ctx.fillStyle = toColor(ditherer.apply(bright, [i, j]))
    ctx.fillRect(i, j, 1, 1)
  }

  if (debug) console.log(`duration: ${(performance.now() - start).toFixed(0)}ms`)

  function toColor(value) {
    let c = Math.min(255, Math.max(0, value * 255))
    return `rgb(${c},${c},${c})`
  }

  function lightBrightness(p, surface_normal, light) {
    let light_dir = norm(diff(light, p))
    let dist = mag(diff(p, light))
    let intensity = 30000/sq(dist)
    return Math.max(0, intensity * dot(surface_normal, light_dir))
  }
}

class HilbertDiffusionDitherer {
  cursor = 0
  errorBuffer = new Array(32).fill(0)
  errorWeight = new Array(32).fill(0).map((_,i) => Math.pow(1/8, i/31)/13.6)
  coordinates(size) {
    return hilbert([0, 0], [size-1, 0], size)
  }
  apply(value) {
    let len = this.errorBuffer.length
    this.cursor = (this.cursor + 1) % len
    let adjustedValue = value - this.errorBuffer[this.cursor]
    let clamped = adjustedValue > 0.5 ? 1 : 0
    this.errorBuffer[this.cursor] = 0
    let deviation = (clamped - adjustedValue)
    for (let n = 0; n < len; n++)
      this.errorBuffer[(n+this.cursor) % len] += deviation * this.errorWeight[n]
    return clamped
  }
}

function* generateRowByRowCoordinates(size) {
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++)
      yield [i,j]
}

class FloydSteinbergDiffusionDitherer {
  cursor = 0
  errorBuffer = []
  coordinates(size) {
    this.errorBuffer = [new Array(size).fill(0), new Array(size).fill(0)]
    return generateRowByRowCoordinates(size)
  }
  apply(value, [i,j]) {
    if (i === 0){
      let [a, b] = this.errorBuffer
      this.errorBuffer = [b, a.map(() => 0)]
    }
    let [currentRow, nextRow] = this.errorBuffer
    const valueWithDiffusedError = clamp(value + currentRow[i], 0, 1)
    let clamped = (valueWithDiffusedError) > 0.5 ? 1 : 0
    let deviation = (valueWithDiffusedError - clamped) / 16
    if (i+1 < currentRow.length) currentRow[i+1] += deviation * 7
    if (i-1 > 0) nextRow[i-1] += deviation * 3
    nextRow[i] += deviation * 5
    if (i+1 < nextRow.length) nextRow[i+1] += deviation * 1
    return clamped
  }
}

class NoiseDitherer {
  cursor = 0
  noise = [0.17, 0.75, 0.43, 0.55, 0.56, 0.70, 0.88]
  coordinates = generateRowByRowCoordinates
  apply(value) {
    this.cursor = (this.cursor + 1) % this.noise.length
    return (value > this.noise[this.cursor]) ? 1 : 0
  }
}

class NoDitherer {
  cursor = 0
  noise = [0.17, 0.75, 0.43, 0.55, 0.56, 0.70, 0.88]
  coordinates = generateRowByRowCoordinates
  apply(value) {
    return value
  }
}
