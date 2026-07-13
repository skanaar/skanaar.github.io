import { Vec, mapply, RotateY, generateRowByRowCoordinates } from '../math.js'
import { Polygon, isValidPolygon, transformTriangle } from './polygon.js'

export function bezier1D([a,b,c,d], t) {
  let w = 1-t
  return w*w*w*a + 3*w*w*t*b +3*w*t*t*c + t*t*t*d
}

export function bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p], u, v) {
  return bezier1D(
    [
      bezier1D([a, b, c, d], u),
      bezier1D([e, f, g, h], u),
      bezier1D([i, j, k, l], u),
      bezier1D([m, n, o, p], u)
    ],
    v
  )
}

export function bezier3DPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p], u, v) {
  return Vec(
    bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p].map(e => e.x), u, v),
    bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p].map(e => e.y), u, v),
    bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p].map(e => e.z), u, v),
  )
}

export function bezierMesh(patches, res, matrix) {
  return patches
    .flatMap(patch => [...generateRowByRowCoordinates(res)]
      .flatMap(({ x: i, y: j }) => [
        Polygon(
          bezier3DPatch(patch, i/res, j/res),
          bezier3DPatch(patch, i/res, (j+1)/res),
          bezier3DPatch(patch, (i+1)/res, j/res)
        ),
        Polygon(
          bezier3DPatch(patch, (i+1)/res, j/res),
          bezier3DPatch(patch, i/res, (j+1)/res),
          bezier3DPatch(patch, (i+1)/res, (j+1)/res)
        ),
      ]).filter(isValidPolygon)
    )
    .map(p => transformTriangle(p, matrix))
}

export function bezierLatheMesh(path, resU, resV, matrix) {
  var mesh = []
  function vertex(i,j) {
    return mapply(RotateY(Math.PI * 2 * i/resU), Vec(
      bezier1D(path.map(e => e.x), j/resV),
      bezier1D(path.map(e => e.y), j/resV),
      bezier1D(path.map(e => e.z), j/resV)
    ))
  }
  for (let i = 0; i < resU; i++) {
    for (var j = 1; j < resV+1; j++) {
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j), vertex(i+1,j-1)))
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j-1), vertex(i,j-1)))
    }
  }
  return mesh.map(p => transformTriangle(p, matrix))
}
