import { Vec, sq, generateRowByRowCoordinates } from '../math.js'
import { Polygon, isValidPolygon, transformTriangle } from './polygon.js'
import { Noise } from '../noise.js'

export function heightMapMesh(opts, matrix) {
  const { res, zoom, isola, octaves, persistence, threshold } = opts
  const noise = Noise({ persistence, octaves, zoom: zoom / 100 })
  let above = (p) => p.a.y > threshold || p.b.y > threshold || p.c.y > threshold
  let point = (i, j) => {
      let r = 2 * (Math.sqrt(sq((i-res/2) / res) + sq((j-res/2) / res)))
      let island = isola * (r < 1 ? Math.cos(3.14 * r) + 1 : 0) + (1-isola) * 1
      return Vec(
        (i / res - 0.5),
        noise(i/res, j/res) * island,
        (j / res - 0.5)
      )
    }
  return [...generateRowByRowCoordinates(res)].flatMap(({ x: i, y: j }) => [
    Polygon(point(i, j), point(i + 1, j), point(i, j + 1)),
    Polygon(point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)),
  ])
  .filter(isValidPolygon)
  .filter(above)
  .map(p => transformTriangle(p, matrix))
}
