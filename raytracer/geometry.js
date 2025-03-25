import { Vec, sq, add, cross, diff, norm, mult, rotx, mapply, Scale } from './math.js'
import { generateRowByRowCoordinates } from './math.js'
import { teapotPatches } from './teapot.js'

export function Light(point, amount) {
  return { point, amount }
}

export function Sphere(center, r, material) {
  return { center, r, material }
}

export function Plane(point, normal, material) {
  return { point, normal: norm(normal), material }
}

export function Polygon(a, b, c) {
  return { a, b, c, normal: norm(cross(diff(c, a), diff(b, a))) }
}

function isValidVec(v) {
  return !Number.isNaN(v[0]) && !Number.isNaN(v[1]) && !Number.isNaN(v[2])
}

function isValidPolygon({ a, b, c, normal }) {
  return isValidVec(a) && isValidVec(b) && isValidVec(c) && isValidVec(normal)
}

export function patch(vertices, scale) {
  let point = (i, j) => mult(scale, vertices[i+4*j])
  return [...generateRowByRowCoordinates(3)].flatMap(([i,j]) => [
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
  return [...generateRowByRowCoordinates(res)].flatMap(([i,j]) => [
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
export function rotateMesh([x], triangles) {
  return triangles.map(({a,b,c}) => Polygon(rotx(x,a), rotx(x,b), rotx(x,c)))
}

export function bezier3DPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p], u, v) {
  return Vec(
    bezierPatch([a[0],b[0],c[0],d[0],e[0],f[0],g[0],h[0],i[0],j[0],k[0],l[0],m[0],n[0],o[0],p[0]], u,v),
    bezierPatch([a[1],b[1],c[1],d[1],e[1],f[1],g[1],h[1],i[1],j[1],k[1],l[1],m[1],n[1],o[1],p[1]], u,v),
    bezierPatch([a[2],b[2],c[2],d[2],e[2],f[2],g[2],h[2],i[2],j[2],k[2],l[2],m[2],n[2],o[2],p[2]], u,v),
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
    .flatMap(patch => [...generateRowByRowCoordinates(res)].flatMap(([i,j]) => [
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
