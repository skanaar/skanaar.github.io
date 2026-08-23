import { add, clamp, cross, diff, lerp, mult, sqMag, Vec } from './math.js'
import { Noise } from './noise.js'

let noise = Noise({ zoom: 100, octaves: 3, persistance: 0.7 })
let softNoise = Noise({ zoom: 100, octaves: 2 })
let waves = (n, x) => Math.sin((x-0.5)*Math.PI*2*n)/2 + 0.5

function hitPatch(hit, normal, color, { mirror = false, glow = false }) {
  return { point: hit.point, depth: hit.depth, normal, color, mirror, glow }
}

export function computeHitPatch(material, hit) {
  if (!material) return hitPatch(hit, hit.normal, 1, {})
  if (material.bump) {
    let u = cross(Vec(0, 1, 0), hit.normal)
    let v = cross(u, hit.normal)
    let b0 = computeAt(material, hit.point, hit)
    let bu = computeAt(material, add(hit.point, u), hit)
    let bv = computeAt(material, add(hit.point, v), hit)
    let bumpNormal = add(hit.normal,
      add(mult(bu.color - b0.color, u), mult(bv.color - b0.color, v))
    )
    return hitPatch(hit, bumpNormal, 1, {})
  }
  return computeAt(material, hit.point, hit)
}

function computeAt(material, point, hit) {
  let { materialKind, shade1, shade2, zoom } = material
  switch (materialKind) {
    case 'mirror': return hitPatch(hit, hit.normal, 1, { mirror: true })
    case 'solid': return hitPatch(hit, hit.normal, shade1, {})
    case 'noise': {
      let value = noise(zoom*point.x, zoom*point.y, zoom*point.z)
      let color = lerp(value, shade1, shade2)
      return hitPatch(hit, hit.normal, color, {})
    }
    case 'wood': {
      let value = softNoise(zoom*point.x, 4*zoom*point.y, 4*zoom*point.z)
      let color = lerp(waves(3, value), shade1, shade2)
      return hitPatch(hit, hit.normal, color, {})
    }
    case 'glow': {
      return hitPatch(hit, hit.normal, shade1, { glow: true })
    }
    case 'dots':
      let x = zoom * 0.01 * point.x
      let y = zoom * 0.01 * point.y
      let z = zoom * 0.01 * point.z
      let d = sqMag(diff(
        Vec(x, y, z),
        Vec(Math.round(x), Math.round(y), Math.round(z))
      ))
      let color = lerp(clamp(d*5, 0, 1), shade1, shade2)
      return hitPatch(hit, hit.normal, color, {})
  }
  return hitPatch(hit, hit.normal, 0, {})
}
