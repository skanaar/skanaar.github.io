import { Vec } from '../math.js'
import { Polygon, transformTriangle } from './polygon.js'

export function boxMesh(matrix) {
  let l = 10
  let o = -10
  let a0 = Vec(o,o,o), b0 = Vec(l,o,o), c0 = Vec(o,l,o), d0 = Vec(l,l,o)
  let a1 = Vec(o,o,l), b1 = Vec(l,o,l), c1 = Vec(o,l,l), d1 = Vec(l,l,l)
  return [
    Polygon(a0,b0,d0), Polygon(a0,d0,c0),
    Polygon(a0,c1,a1), Polygon(a0,c0,c1),
    Polygon(a0,a1,b1), Polygon(a0,b1,b0),
    Polygon(d1,b1,a1), Polygon(d1,a1,c1),
    Polygon(d1,c1,c0), Polygon(d1,c0,d0),
    Polygon(d1,d0,b0), Polygon(d1,b0,b1),
  ].map(p => transformTriangle(p, matrix))
}
