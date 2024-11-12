import { Vec, sq, add, cross, diff, norm, mult, rotx, mapply, Scale } from './math.js'
import { generateRowByRowCoordinates } from './math.js'
import { teapotPatches } from './teapot.js'

export function Light(point, amount) {
  return { point, amount }
}

export function Sphere(center, r, material) {
  return { center, r, mirror: material == 'mirror' }
}

export function Plane(point, normal, material) {
  return { point, normal: norm(normal), mirror: material === 'mirror' }
}

export function Polygon(a, b, c) {
  return { a, b, c, normal: norm(cross(diff(c, a), diff(b, a))) }
}

function isValidVec(v) {
  return !Number.isNaN(v.x) && !Number.isNaN(v.y) && !Number.isNaN(v.z)
}

function isValidPolygon({ a, b, c, normal }) {
  return isValidVec(a) && isValidVec(b) && isValidVec(c) && isValidVec(normal)
}

export function patch(vertices, scale) {
  let point = (i, j) => mult(scale, vertices[i+4*j])
  return [...generateRowByRowCoordinates(3)].flatMap(({ x: i, y: j }) => [
    Polygon(point(i, j), point(i, j + 1), point(i + 1, j)),
    Polygon(point(i + 1, j), point(i, j + 1), point(i + 1, j + 1)),
  ]).filter(isValidPolygon)
}

export function wave({ res, size, height, periods }, matrix) {
  let point = (i, j) => {
      let r = 2 * (Math.sqrt(sq((i-res/2) / res) + sq((j-res/2) / res)))
      return Vec(
        i * size / res,
        height * (1 / (1+4*r*r)) * Math.cos(periods * 3.14 * r),
        j * size / res
      )
    }
  return [...generateRowByRowCoordinates(res)].flatMap(({ x: i, y: j }) => [
    Polygon(point(i, j), point(i + 1, j), point(i, j + 1)),
    Polygon(point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)),
  ])
  .filter(isValidPolygon)
  .map(p => transformTriangle(p, matrix))
}

export function transformTriangle(poly, matrix) {
  let { a, b, c } = poly
  return Polygon(mapply(matrix, a), mapply(matrix, b), mapply(matrix, c))
}

export function offsetMesh(v, triangles) {
  return triangles.map(({a,b,c}) => Polygon(add(a, v), add(b, v), add(c, v)))
}
export function scaleMesh(k, triangles) {
  return triangles.map(({a,b,c}) => Polygon(mult(k, a), mult(k, b), mult(k, c)))
}
export function rotateMesh({ x }, triangles) {
  return triangles.map(({a,b,c}) => Polygon(rotx(x,a), rotx(x,b), rotx(x,c)))
}

export function bezier3DPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p], u, v) {
  return Vec(
    bezierPatch([a.x,b.x,c.x,d.x,e.x,f.x,g.x,h.x,i.x,j.x,k.x,l.x,m.x,n.x,o.x,p.x], u,v),
    bezierPatch([a.y,b.y,c.y,d.y,e.y,f.y,g.y,h.y,i.y,j.y,k.y,l.y,m.y,n.y,o.y,p.y], u,v),
    bezierPatch([a.z,b.z,c.z,d.z,e.z,f.z,g.z,h.z,i.z,j.z,k.z,l.z,m.z,n.z,o.z,p.z], u,v),
  )
}
function bezier1D([a,b,c,d], t) {
  let w = 1-t
  return w*w*w*a + 3*w*w*t*b +3*w*t*t*c + t*t*t*d
}
function bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p], u, v) {
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

export function teapot(res, transformMatrix) {
  return bezierMesh(teapotPatches, res, Scale(50,50,50))
}

export function bezierMesh(patches, res, matrix) {
  return [...patches
    .flatMap(patch => [...generateRowByRowCoordinates(res)].flatMap(({ x: i, y: j }) => [
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
    ]).filter(isValidPolygon))
    .map(p => transformTriangle(p, matrix))
  ]
}
