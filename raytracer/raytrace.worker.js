import {
  Vec,
  norm,
  diff,
  dot,
  add,
  mult,
  sqMag,
  crossDiff,
  EPSILON
} from './math.js'

let maxDepth = 3

onmessage = (e) => {
  let imgdata = raytrace(e.data)
  postMessage(imgdata)
}

function raytrace({ area, size, spheres, planes, triangles, lights }) {
  let { width, height, x, y } = area
  let imgdata = new ImageData(width, height)

  let camera = Vec(128.0, 128.0, 512.0)

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let screenPoint = Vec(i+x, j+y, 0)
      let ray = norm(diff(screenPoint, camera))
      let hit = trace_ray(camera, ray, 0, { spheres, planes, triangles })

      // hit patch illumination
      let bright = 0
      if (hit.depth < 1000)
        for (let light of lights)
          bright += lightBrightness(hit.point, hit.normal, light)
      bright = hdr(bright)
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

function trace_ray(camera, ray, depth, { spheres, planes, triangles }) {
  let hit = { depth: 1000.0, normal: Vec(0.0,0.0,0.0), point: Vec(0.0,0.0,0.0) }

  // sphere intersections
  for (let { center, r, mirror } of spheres) {
    let a = dot(ray, ray)
    let b = 2 * dot(ray, diff(camera, center))
    let c = dot(center,center) + dot(camera,camera) - 2*dot(center,camera) - r*r
    let disc = b * b - 4 * a * c
    if (disc < 0) continue
    let t = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a)
    if (t > hit.depth) continue
    if (t < EPSILON) continue // no hits behind camera
    let p = add(camera, mult(t, ray))
    let normal = mult(1 / r, diff(p, center))
    if (mirror && depth < maxDepth) {
      let reflection_ray = add(ray, mult(-2*dot(normal, ray), normal))
      let world = { spheres, planes, triangles }
      let recursiveHit = trace_ray(p, reflection_ray, depth + 1, world)
      hit = { depth: t, normal: recursiveHit.normal, point: recursiveHit.point }
    } else {
      hit = { depth: t, normal, point: p }
    }
  }

  // plane intersections
  for (let { point, normal, mirror } of planes) {
    if (dot(ray, normal) > 0) continue
    let t = (dot(point, normal) - dot(camera, normal)) / dot(ray, normal)
    if (t > hit.depth) continue
    if (t < EPSILON) continue // no hits behind camera
    let p = add(camera, mult(t, ray))
    if (mirror && depth < maxDepth) {
      let reflection_ray = add(ray, mult(-2*dot(normal, ray), normal))
      let world = { spheres, planes, triangles }
      let recursiveHit = trace_ray(p, reflection_ray, depth + 1, world)
      hit = { depth: t, normal: recursiveHit.normal, point: recursiveHit.point }
    } else {
      hit = { depth: t, normal, point: p }
    }
  }

  // triangle intersections
  for (let triangle of triangles) {
    let { a, b, c, normal } = triangle
    let maxDepth = hit.depth
    let denominator = dot(ray, normal)
    // expect denominator to be negative (with margin)
    if (denominator > -EPSILON) continue
    let t = (dot(triangle.a, normal) - dot(camera, normal)) / denominator
    if (t > maxDepth) continue
    if (t < EPSILON) continue // no hits behind camera
    const p = add(camera, mult(t, ray))
    // is p outside triangle?
    let to_a = crossDiff(c, b, normal)
    if (dot(diff(p, b), to_a) < 0.0) continue
    let to_b = crossDiff(a, c, normal)
    if (dot(diff(p, c), to_b) < 0.0) continue
    let to_c = crossDiff(b, a, normal)
    if (dot(diff(p, a), to_c) < 0.0) continue

    hit = { depth: t, normal: triangle.normal, point: p }
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
