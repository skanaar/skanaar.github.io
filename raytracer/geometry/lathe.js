import { mapply, RotateY } from '../math.js'
import { Polygon, isValidPolygon, transformTriangle } from './polygon.js'

export function latheMesh(path, res, matrix) {
  var vertex = (i,j) => mapply(RotateY(-Math.PI * 2 * i/res), path[j])
  var mesh = []
  for (let i = 0; i < res; i++) {
    for (var j=1; j<path.length; j++) {
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j), vertex(i+1,j-1)))
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j-1), vertex(i,j-1)))
    }
  }
  return mesh.filter(isValidPolygon).map(p => transformTriangle(p, matrix))
}
