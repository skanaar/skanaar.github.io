import { Camera, Offset } from './objects.js'
import { toMatrix } from './geometry.js'
import {
  Vec,
  norm,
  diff,
  dot,
  div,
  add,
  sqMag,
  mult,
  mag,
  crossDiff,
  EPSILON,
  mapply
} from './math.js'

const FAR_AWAY = 32000

onmessage = (e) => {
  let imgdata = raytrace(e.data)
  postMessage(imgdata)
}

function raytrace({ area, totalArea, size, maxDepth, scene }) {
  let { width, height, x, y } = area
  let camera = scene.find(e => e.kind === 'camera') ?? Camera([Offset(0,0,256)])
  let lights = scene.filter(e => e.kind === 'light')

  let spheres = scene.filter(e => e.kind === 'sphere').map(PrecomputedSphere)
  let meshes = scene.filter(e => e.kind === 'mesh').map(PrecomputedMesh)

  let imgdata = new ImageData(width, height)

  let camMatrix = toMatrix(camera.transforms)
  let camPos = mapply(camMatrix, Vec(0,0,0))
  let camCorner = mapply(camMatrix, Vec(-0.5,-0.5,-1))
  let camRight = diff(mapply(camMatrix, Vec(1,0,0)), camPos)
  let camUp = diff(mapply(camMatrix, Vec(0,1,0)), camPos)

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let screenPoint = add(camCorner, add(
        mult((i+x)/totalArea.width, camRight),
        mult((j+y)/totalArea.height, camUp)
      ))
      let ray = norm(diff(screenPoint, camPos))
      let hit = trace_ray(camPos, ray, maxDepth, spheres, meshes)

      // hit patch illumination
      let bright = 0
      if (hit.depth < FAR_AWAY) {
        for (let light of lights) {
          let light_vector = diff(hit.point, light.point)
          let light_dist = mag(light_vector)
          let light_dir = div(light_vector, light_dist)
          let beam = trace_ray(light.point, light_dir, 0, spheres, meshes)
          if (beam.depth > light_dist - EPSILON)
            bright += lightBrightness(hit.point, hit.normal, light)
        }
      }
      bright = hdr(bright * materialColor(hit))
      let value = Math.min(255, Math.floor(bright * 255))
      let offset = (i + j*size)*4
      imgdata.data[offset] = value
      imgdata.data[offset + 1] = value
      imgdata.data[offset + 2] = value
      imgdata.data[offset + 3] = 255
    }
    postMessage({ progress: 'row_complete' })
  }

  return imgdata
}

function materialColor(hit) {
  if (hit.material == 'diffuse') return 1
  if (hit.material == 'dark') return 0.5
  return 1
}

// Precompute the ray-invariant terms once per scene so the per-ray hot loop
// only touches values that actually depend on the ray.

function PrecomputedSphere({ center, r, material }) {
  return {
    center, r, material,
    boundC: dot(center, center) - r * r,
  }
}

function PrecomputedMesh({ polys, center, radius, material }) {
  return {
    center, material,
    boundC: dot(center, center) - radius * radius,
    polys: polys.map(PrecomputedPoly),
  }
}

function PrecomputedPoly({ a, b, c, normal }) {
  return {
    a, b, c, normal,
    planeD: dot(a, normal),
    // inside-test edges (constant per triangle): crossDiff(vertex pair, normal)
    edgeA: crossDiff(c, b, normal),
    edgeB: crossDiff(a, c, normal),
    edgeC: crossDiff(b, a, normal),
  }
}

function trace_ray(camera, ray, depthBudget, spheres, meshes) {
  let hit = {
    depth: FAR_AWAY,
    normal: Vec(0.0,0.0,0.0),
    point: Vec(0.0,0.0,0.0),
    material: 'diffuse',
  }

  // Ray is unit length, so the quadratic's `a` term is 1. These two dot
  // products are constant across every object for this ray.
  let camSq = dot(camera, camera)
  let rayDotCamera = dot(ray, camera)

  // sphere intersections
  for (let s of spheres) {
    let center = s.center
    let b = 2 * (rayDotCamera - dot(ray, center))
    let c = s.boundC + camSq - 2 * dot(center, camera)
    let disc = b * b - 4 * c
    if (disc < 0) continue
    let t = (-b - Math.sqrt(disc)) / 2
    if (t > hit.depth) continue
    if (t < EPSILON) continue // no hits behind camera
    let p = add(camera, mult(t, ray))
    let normal = mult(1 / s.r, diff(p, center))
    hit = { depth: t, normal, point: p, material: s.material }
  }

  for (let m of meshes) {
    // bounding sphere test
    let center = m.center
    let b = 2 * (rayDotCamera - dot(ray, center))
    let c = m.boundC + camSq - 2 * dot(center, camera)
    if (b * b - 4 * c < 0) continue

    // triangle intersections
    let polys = m.polys
    let material = m.material
    for (let i = 0; i < polys.length; i++) {
      let tri = polys[i]
      let n = tri.normal
      let denominator = dot(ray, n)
      // expect denominator to be negative (with margin)
      if (denominator > -EPSILON) continue
      let t = (tri.planeD - dot(camera, n)) / denominator
      if (t > hit.depth) continue
      if (t < EPSILON) continue // no hits behind camera
      let px = camera.x + t*ray.x
      let py = camera.y + t*ray.y
      let pz = camera.z + t*ray.z
      // is p outside triangle? (edges precomputed on the poly)
      let vb = tri.b, ea = tri.edgeA
      if ((px-vb.x)*ea.x + (py-vb.y)*ea.y + (pz-vb.z)*ea.z < 0.0) continue
      let vc = tri.c, eb = tri.edgeB
      if ((px-vc.x)*eb.x + (py-vc.y)*eb.y + (pz-vc.z)*eb.z < 0.0) continue
      let va = tri.a, ec = tri.edgeC
      if ((px-va.x)*ec.x + (py-va.y)*ec.y + (pz-va.z)*ec.z < 0.0) continue

      hit = { depth: t, normal: n, point: Vec(px,py,pz), material }
    }
  }

  if (hit.material === 'mirror' && depthBudget > 0) {
    let reflection_ray = add(ray, mult(-2*dot(hit.normal, ray), hit.normal))
    let nextHit = trace_ray(hit.point, reflection_ray, depthBudget - 1, spheres, meshes)
    hit = { depth: hit.depth, normal: nextHit.normal, point: nextHit.point }
  }

  return hit
}

function hdr(value) {
  return 1 - 1 / (1 + 2 * value)
}

function lightBrightness(p, surface_normal, light) {
  let light_dir = norm(diff(light.point, p))
  let intensity = light.amount * 300 / sqMag(diff(p, light.point))
  return Math.max(0, intensity * dot(surface_normal, light_dir))
}
