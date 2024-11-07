import { Vec, norm, diff, dot, add, mult, sqMag, crossDiff } from './math.js'

let EPSILON = 0.001

export function raytrace({ canvas, size, spheres, planes, triangles, lights, ditherer, debug }) {
  let ctx = canvas.getContext("2d")
  let imgdata = ctx.createImageData(size, size)

  let camera = Vec(128, 128, 512)

  let start = performance.now()
  for (let screenPoint of ditherer.coordinates(size)) {
    let camDir = norm(diff(screenPoint, camera))
    let hit = trace_ray(camera, camDir, 0, { spheres, planes, triangles })

    // hit patch illumination
    let bright = 0
    if (hit.depth < 1000)
      for (let light of lights)
        bright += lightBrightness(hit.point, hit.normal, light)
    bright = hdr(bright)
    let value = Math.floor(ditherer.apply(bright, screenPoint) * 255)
    let offset = (screenPoint.x + screenPoint.y*size)*4
    imgdata.data[offset] = value
    imgdata.data[offset + 1] = value
    imgdata.data[offset + 2] = value
    imgdata.data[offset + 3] = 255
  }
  ctx.putImageData(imgdata, 0, 0)

  if (debug) console.log(`duration: ${(performance.now() - start).toFixed(0)}ms`)
}

function trace_ray(camera, camDir, depth, { spheres, planes, triangles }) {
  let hit = { depth: 1000.0, normal: Vec(0, 0, 0), point: Vec(0, 0, 0) }

  // sphere intersections
  for (let { center, r, mirror } of spheres) {
    let a = dot(camDir, camDir)
    let b = 2 * dot(camDir, diff(camera, center))
    let c = dot(center, center) + dot(camera, camera) + -2 * dot(center, camera) - r * r
    let disc = b * b - 4 * a * c
    if (disc < 0) continue
    let t = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a)
    if (t > hit.depth) continue
    if (t < EPSILON) continue // no hits behind camera
    let p = add(camera, mult(t, camDir))
    let normal = mult(1 / r, diff(p, center))
    if (mirror && depth < 1) {
      let reflection_ray = add(camDir, mult(-2*dot(normal, camDir), normal))
      hit = trace_ray(p, reflection_ray, depth + 1, { spheres, planes, triangles })
    } else {
      hit = { depth: t, normal, point: p }
    }
  }

  // plane intersections
  for (let { point, normal } of planes) {
    if (dot(camDir, normal) > 0) continue
    let t = (dot(point, normal) - dot(camera, normal)) / dot(camDir, normal)
    if (t > hit.depth) continue
    if (t < EPSILON) continue // no hits behind camera
    hit = { depth: t, normal, point: add(camera, mult(t, camDir)) }
  }

  // triangle intersections
  for (let { a, b, c, normal } of triangles) {
    let denominator = dot(camDir, normal)
    if (denominator > 0) continue
    if (-denominator < EPSILON) continue
    let t = (dot(a, normal) - dot(camera, normal)) / denominator
    if (t > hit.depth) continue
    if (t < EPSILON) continue // no hits behind camera
    const p = add(camera, mult(t, camDir))
    // is p outside triangle?
    let to_a = crossDiff(c, b, normal)
    if (dot(diff(p, b), to_a) < 0) continue
    let to_b = crossDiff(a, c, normal)
    if (dot(diff(p, c), to_b) < 0) continue
    let to_c = crossDiff(b, a, normal)
    if (dot(diff(p, a), to_c) < 0) continue
    hit = { depth: t, normal, point: p }
  }
  return hit
}

function hdr(value) {
  return 1 + 1 / -(1 + 2 * value)
}

function lightBrightness(p, surface_normal, light) {
  let light_dir = norm(diff(light.point, p))
  let intensity = light.amount * 300 / sqMag(diff(p, light.point))
  return Math.max(0, intensity * dot(surface_normal, light_dir))
}
