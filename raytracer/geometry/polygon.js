import { cross, diff, norm, mapply } from '../math.js'

export function Polygon(a, b, c) {
  const normal = norm(cross(diff(c, a), diff(b, a)))
  return { kind: 'poly', a, b, c, normal }
}

export function isValidVec(v) {
  return !Number.isNaN(v.x) && !Number.isNaN(v.y) && !Number.isNaN(v.z)
}

export function isValidPolygon({ a, b, c, normal }) {
  return isValidVec(a) && isValidVec(b) && isValidVec(c) && isValidVec(normal)
}

export function transformTriangle(poly, matrix) {
  let { a, b, c } = poly
  return Polygon(mapply(matrix, a), mapply(matrix, b), mapply(matrix, c))
}
