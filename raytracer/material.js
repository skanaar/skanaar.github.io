import { clamp, diff, lerp, sqMag, Vec } from './math.js'
import { Noise } from './noise.js'

let noise = Noise({ zoom: 100, octaves: 3, persistance: 0.7 })
let softNoise = Noise({ zoom: 100, octaves: 2 })
let waves = (n, x) => Math.sin((x-0.5)*Math.PI*2*n)/2 + 0.5

export function computeColor(material, hit) {
  if (!material) return 1
  let { materialKind, shade1, shade2, zoom } = material
  switch (materialKind) {
    case 'solid': return shade1
    case 'noise': {
      let value = noise(zoom * hit.point.x, zoom * hit.point.y)
      return lerp(value, shade1, shade2)
    }
    case 'wood': {
      let value = softNoise(zoom * hit.point.x, 4 * zoom * hit.point.y)
      return lerp(waves(3, value), shade1, shade2)
    }
    case 'dots':
      let x = zoom * 0.01 * hit.point.x
      let y = zoom * 0.01 * hit.point.y
      let z = zoom * 0.01 * hit.point.z
      let d = sqMag(diff(
        Vec(x, y, z),
        Vec(Math.round(x), Math.round(y), Math.round(z))
      ))
      return lerp(clamp(d*5, 0, 1), shade1, shade2)
  }
  if (material.solid) return material.shade1
}
