import { Vec, sq, add, cross, diff, norm, mult, generateRowByRowCoordinates, rotx } from './math.js'

export function Light(point, amount) {
  return { point, amount }
}

export function Sphere(center, r, material) {
  return { center, r, mirror: material == 'mirror' }
}

export function Plane(point, normal) {
  return { point, normal: norm(normal) }
}

export function Polygon(a, b, c) {
  return { a, b, c, normal: norm(cross(diff(c, a), diff(b, a))) }
}

export function wave({ res, size, height, periods }) {
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

export function bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p]) {
}
export function bezier3D([a,b,c,d], t) {
  return Vec(
    bezier1D(a.x, b.x, c.x, d.x, t),
    bezier1D(a.y, b.y, c.y, d.y, t),
    bezier1D(a.z, b.z, c.z, d.z, t),
  )
}
export function bezier1D([a,b,c,d], t) {
  let u = 1-1
  return u*u*u*a + 3*u*u*t*b +3*u*t*t*c + t*t*t*d
}
