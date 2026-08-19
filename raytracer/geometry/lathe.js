import { mapply, RotateY, π } from '../math.js'
import { Polygon, isValidPolygon, transformTriangle } from './polygon.js'

export function latheMesh(path, res, angle, matrix) {
  var vertex = (i,j) => mapply(RotateY(-π * angle/180 * i/res), path[j])
  var mesh = []
  for (let i = 0; i < res; i++) {
    for (var j=1; j<path.length; j++) {
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j), vertex(i+1,j-1)))
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j-1), vertex(i,j-1)))
    }
  }
  return mesh.filter(isValidPolygon).map(p => transformTriangle(p, matrix))
}
