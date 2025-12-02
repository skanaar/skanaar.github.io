import { Vec, Scale, Translate, RotateX, RotateY, RotateZ, π, mag } from './math.js'
import { sq, add, cross, diff, norm, mult, rotx, mapply } from './math.js'
import { generateRowByRowCoordinates, matrixStack } from './math.js'
import { Noise } from './noise.js'

export function Offset(x,y,z) { return { kind: 'offset', x, y, z } }
export function Rotate(x,y,z) { return { kind: 'rotate', x, y, z } }
export function Scaling(x,y,z) { return { kind: 'scale', x, y, z } }
export function toMatrix(transforms) {
  let rad = (degrees) => degrees * π/180
  return matrixStack(...transforms.flatMap(({ kind, x, y, z }) => {
    switch (kind) {
      case 'offset': return [Translate(x, y, z)]
      case 'rotate': return [RotateX(rad(x)), RotateY(rad(y)), RotateZ(rad(z))]
      case 'scale': return [Scale(x, y, z)]
    }
  }))
}

export function Camera(transforms) {
  return { kind: 'camera', transforms }
}

export function Composite(name, children, transforms) {
  return { kind: 'composite', name, children, transforms }
}

export function Mesh(polys) {
  const vertices = polys
    .flatMap(({ a, b, c }) => [a, b, c])
  let center = mult(1/vertices.length, vertices.reduce((acc, e) => add(acc,e)))
  let radius = vertices.reduce((max,p) => Math.max(mag(diff(center,p)), max), 0)
  return { kind: 'mesh', polys, center, radius }
}

export function Light(transforms) {
  return { kind: 'light', transforms }
}

export function Sphere(name, material, transforms) {
  return { kind: 'sphere', name, material, transforms }
}

export function Polygon(a, b, c) {
  const normal = norm(cross(diff(c, a), diff(b, a)))
  return { kind: 'poly', a, b, c, normal }
}

export function Lathe(name, res, path, transforms) {
  return { kind: 'lathe', name, path, res, transforms }
}

export function Box(name, transforms) {
  return { kind: 'box', name, transforms }
}

export function BezierLathe(name, resU, resV, path, transforms) {
  return { kind: 'bezierlathe', name, path, resU, resV, transforms }
}

export function BezierPatchSet(name, patches, res, transforms) {
  return { kind: 'patches', name, patches, res, transforms }
}

export function HeightMap(name, { res, size, height, bump }, transforms) {
  return { kind: 'heightmap', name, res, size, height, bump, transforms }
}

export function compileObject(obj) {
  switch (obj.kind) {
    case 'lathe': return Mesh(
      latheMesh(obj.path, obj.res, toMatrix(obj.transforms))
    )
    case 'bezierlathe': return Mesh(
      bezierLatheMesh(obj.path, obj.resU, obj.resV, toMatrix(obj.transforms))
    )
    case 'patches': return Mesh(
      bezierMesh(obj.patches, obj.res, toMatrix(obj.transforms))
    )
    case 'box':
      let o = -1
      let a0 = Vec(o,o,o), b0 = Vec(1,o,o), c0 = Vec(o,1,o), d0 = Vec(1,1,o)
      let a1 = Vec(o,o,1), b1 = Vec(1,o,1), c1 = Vec(o,1,1), d1 = Vec(1,1,1)
      return Mesh([
        Polygon(a0,b0,d0), Polygon(a0,d0,c0),
        Polygon(a0,c1,a1), Polygon(a0,c0,c1),
        Polygon(a0,a1,b1), Polygon(a0,b1,b0),
        Polygon(d1,b1,a1), Polygon(d1,a1,c1),
        Polygon(d1,c1,c0), Polygon(d1,c0,d0),
        Polygon(d1,d0,b0), Polygon(d1,b0,b1),
      ].map(p => transformTriangle(p, toMatrix(obj.transforms))))
    case 'heightmap': return Mesh(
      heightMapMesh(obj, toMatrix(obj.transforms))
    )
    case 'composite':
      let fullMesh = obj.children.flatMap(e => compileObject(e).polys)
      return Mesh(
        fullMesh.map(p => transformTriangle(p, toMatrix(obj.transforms)))
      )
    case 'light': {
      let matrix = toMatrix(obj.transforms)
      return {
        ...obj,
        point: mapply(matrix, Vec(0,0,0)),
        amount: mag(diff(mapply(matrix,Vec(0,0,0)), mapply(matrix,Vec(1,0,0))))
      }
    }
    case 'sphere': {
      let matrix = toMatrix(obj.transforms)
      return {
        ...obj,
        center: mapply(matrix, Vec(0,0,0)),
        r: mag(diff(mapply(matrix, Vec(0,0,0)), mapply(matrix, Vec(1,0,0))))
      }
    }
    default: return obj
  }
}

export function compileScene(objects) {
  return objects.map(e => compileObject(e))
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
    bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p].map(e => e.x), u, v),
    bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p].map(e => e.y), u, v),
    bezierPatch([a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p].map(e => e.z), u, v),
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

export function bezierMesh(patches, res, matrix) {
  return [...patches
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
  ]
}

export function latheMesh(path, res, matrix) {
  var vertex = (i,j) => mapply(RotateZ(Math.PI * 2 * i/res), path[j])
  var mesh = []
  for (let i = 0; i < res; i++) {
    for (var j=1; j<path.length; j++) {
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j), vertex(i+1,j-1)))
      mesh.push(Polygon(vertex(i,j), vertex(i+1,j-1), vertex(i,j-1)))
    }
  }
  return mesh.filter(isValidPolygon).map(p => transformTriangle(p, matrix))
}

export function bezierLatheMesh(path, resU, resV, matrix) {
  var mesh = []
  function vertex(i,j) {
    return mapply(RotateZ(Math.PI * 2 * i/resU), Vec(
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

export function heightMapMesh({ res, size, height, bump }, matrix) {
  const noise = Noise({ persistence: 0.5, octaves: 4, zoom: 10 })
  let point = (i, j) => {
      let r = 2 * (Math.sqrt(sq((i-res/2) / res) + sq((j-res/2) / res)))
      let undulation = noise(i, j)
      return Vec(
        (i / res - 0.5) * size,
        (height+bump*undulation) * (r < 1 ? Math.cos(3.14 * r) + 1 : 0),
        (j / res - 0.5) * size
      )
    }
  return [...generateRowByRowCoordinates(res)].flatMap(({ x: i, y: j }) => [
    Polygon(point(i, j), point(i + 1, j), point(i, j + 1)),
    Polygon(point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)),
  ])
  .filter(isValidPolygon)
  .map(p => transformTriangle(p, matrix))
}
