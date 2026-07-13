import { Vec, add, cross, norm, mult } from '../math.js'
import { Polygon, transformTriangle } from './polygon.js'

// Deterministic PRNG (mulberry32)
function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function perpendicularAxes(dir) {
  let ref = Math.abs(dir.z) < 0.9 ? Vec(0,0,1) : Vec(0,1,0)
  let u = norm(cross(ref, dir))
  let v = cross(dir, u)
  return [u, v]
}

export function treeMesh(opts, matrix) {
  let {
    branches, trunkWidth, branchLength, leafCount,
    iterations, branchAngle, angleRandomness, randomSeed,
  } = opts
  let trunkLength = 100
  let trunkTop = trunkWidth / 2
  let taper = 0.5
  let angle = branchAngle * Math.PI / 180
  let rand = seededRandom(randomSeed)
  let leafRand = seededRandom(randomSeed)
  let jitter = (amount) => (amount * 2 - 1) * angleRandomness * Math.PI / 180
  let mesh = []

  function frustum(res, base, top, dir, rBase, rTop) {
    let [u, v] = perpendicularAxes(dir)
    let ring = (center, r, i) => {
      let a = 2 * Math.PI * i / res
      return add(center, mult(r, add(mult(Math.cos(a),u), mult(Math.sin(a),v))))
    }
    for (let i = 0; i < res; i++) {
      let b0 = ring(base, rBase, i), b1 = ring(base, rBase, i+1)
      let t0 = ring(top, rTop, i), t1 = ring(top, rTop, i+1)
      mesh.push(Polygon(b0, t0, t1))
      mesh.push(Polygon(b0, t1, b1))
    }
  }

  function leaves(tip, dir, size) {
    let [u, v] = perpendicularAxes(dir)
    let halfWidth = size * 0.35
    for (let l = 0; l < leafCount; l++) {
      let az = 2 * Math.PI * l / leafCount + jitter(leafRand())
      let tilt = 90 * Math.PI / 180 + jitter(leafRand())
      let side = add(mult(Math.cos(az), u), mult(Math.sin(az), v))
      let leafDir = norm(
        add(mult(Math.cos(tilt), dir), mult(Math.sin(tilt), side))
      )
      let far = add(tip, mult(size, leafDir))
      let perp = norm(cross(leafDir, dir))
      let b = add(far, mult(halfWidth, perp))
      let c = add(far, mult(-halfWidth, perp))
      mesh.push(Polygon(tip, b, c))
      mesh.push(Polygon(tip, c, b))
    }
  }

  function branch(base, dir, res, length, rBase, rTop, depth) {
    let top = add(base, mult(length, dir))
    frustum(res, base, top, dir, rBase, rTop)
    if (depth <= 0) {
      leaves(top, dir, length*0.7)
      return
    }
    let [u, v] = perpendicularAxes(dir)
    for (let k = 0; k < branches; k++) {
      let az = 2 * Math.PI * k / branches + jitter(rand())
      let tilt = angle + jitter(rand())
      let side = add(mult(Math.cos(az), u), mult(Math.sin(az), v))
      let childDir = norm(
        add(mult(Math.cos(tilt), dir), mult(Math.sin(tilt), side))
      )
      const len = length * branchLength
      branch(top, childDir, Math.max(3,res/2), len, rTop, rTop * taper, depth-1)
    }
  }

  let zero = Vec(0,0,0)
  branch(zero, Vec(0,-1,0), 12, trunkLength, trunkWidth, trunkTop, iterations)
  return mesh.map(p => transformTriangle(p, matrix))
}
