import { Vec, Scale, Translate, RotateX, RotateY, RotateZ, π } from './math.js'
import { sq, add, cross, diff, norm, mult, rotx, mapply, mag } from './math.js'
import { generateRowByRowCoordinates, matrixStack } from './math.js'
import { Noise } from './noise.js'

export function Offset(x,y,z) { return { x, y, z } }
export function Rotate(x,y,z) { return { x, y, z } }
export function Scaling(x,y,z) { return { x, y, z } }
export function toMatrix({ offset, rotate, scale }) {
  return matrixStack(
    Translate(offset.x, offset.y, offset.z),
    RotateX(rotate.x * π/180),
    RotateY(rotate.y * π/180),
    RotateZ(rotate.z * π/180),
    Scale(scale.x, scale.y, scale.z),
  )
}

export function Transforms(offset, rotate, scale = Scaling(1,1,1)) {
  return { offset, rotate: rotate ?? Rotate(0,0,0), scale }
}

export function Camera(transforms) {
  return { kind: 'camera', transforms }
}

export function Composite(name, children, transforms) {
  return { kind: 'composite', name, children, transforms }
}

export function Instance(name, ref, transforms) {
  return { kind: 'instance', name, ref, transforms }
}

export function Mesh(material, polys) {
  const vertices = polys
    .flatMap(({ a, b, c }) => [a, b, c])
  let center = mult(1/vertices.length, vertices.reduce((acc, e) => add(acc,e)))
  let radius = vertices.reduce((max,p) => Math.max(mag(diff(center,p)), max), 0)
  return { kind: 'mesh', material, polys, center, radius }
}

export function NullObject() {
  return { kind: 'null' }
}

export function Light(amount, offset) {
  let transforms = Transforms(offset, Rotate(0,0,0), Scaling(1,1,1))
  return { kind: 'light', amount, transforms }
}

export function Sphere(name, material, transforms) {
  return { kind: 'sphere', name, material, transforms }
}

export function Polygon(a, b, c) {
  const normal = norm(cross(diff(c, a), diff(b, a)))
  return { kind: 'poly', a, b, c, normal }
}

export function Lathe(name, res, path, transforms) {
  return { kind: 'lathe', name, material: 'diffuse', path, res, transforms }
}

export function Box(name, transforms) {
  return { kind: 'box', name, material: 'diffuse', transforms }
}

export function BezierLathe(name, resU, resV, path, transforms) {
  let material = 'diffue'
  return { kind: 'bezierlathe', name, material, path, resU, resV, transforms }
}

export function BezierPatchSet(name, patches, res, transforms) {
  return { kind: 'patches', name, material:'diffuse', patches, res, transforms }
}

export function HeightMap(name, { res, size, height, bump }, transforms) {
  return { kind: 'heightmap', name, res, size, height, bump, transforms }
}

export function compileObject(obj, objects) {
  switch (obj.kind) {
    case 'lathe': return Mesh(
      obj.material,
      latheMesh(obj.path, obj.res, toMatrix(obj.transforms))
    )
    case 'bezierlathe': return Mesh(
      obj.material,
      bezierLatheMesh(obj.path, obj.resU, obj.resV, toMatrix(obj.transforms))
    )
    case 'patches': return Mesh(
      obj.material,
      bezierMesh(obj.patches, obj.res, toMatrix(obj.transforms))
    )
    case 'box':
      let o = -1
      let a0 = Vec(o,o,o), b0 = Vec(1,o,o), c0 = Vec(o,1,o), d0 = Vec(1,1,o)
      let a1 = Vec(o,o,1), b1 = Vec(1,o,1), c1 = Vec(o,1,1), d1 = Vec(1,1,1)
      return Mesh(
        obj.material,
        [
          Polygon(a0,b0,d0), Polygon(a0,d0,c0),
          Polygon(a0,c1,a1), Polygon(a0,c0,c1),
          Polygon(a0,a1,b1), Polygon(a0,b1,b0),
          Polygon(d1,b1,a1), Polygon(d1,a1,c1),
          Polygon(d1,c1,c0), Polygon(d1,c0,d0),
          Polygon(d1,d0,b0), Polygon(d1,b0,b1),
        ].map(p => transformTriangle(p, toMatrix(obj.transforms)))
      )
    case 'heightmap': return Mesh(
      obj.material,
      heightMapMesh(obj, toMatrix(obj.transforms))
    )
    case 'composite': {
      let mesh = obj.children.flatMap(e => compileObject(e, obj.children).polys)
      if (mesh.length == 0) return NullObject()
      return Mesh(
        obj.material,
        mesh.map(p => transformTriangle(p, toMatrix(obj.transforms)))
      )
    }
    case 'instance':
      let template = objects.find(e => e.name == obj.ref)
      if (!obj.ref || !template) return NullObject()
      template = { ...template, transforms: Transforms(Offset(0,0,0)) }
      // TODO: support for non-mesh objects here
      let mesh = compileObject(template, template.children ?? []).polys
      return Mesh(
        template.material,
        mesh.map(p => transformTriangle(p, toMatrix(obj.transforms)))
      )
    case 'light': {
      let point = mapply(toMatrix(obj.transforms), Vec(0,0,0))
      return { ...obj, point, center: point, r: 1 }
    }
    case 'sphere': {
      let matrix = toMatrix(obj.transforms)
      return {
        ...obj,
        center: mapply(matrix, Vec(0,0,0)),
        r: mag(diff(mapply(matrix, Vec(0,0,0)), mapply(matrix, Vec(1,0,0))))
      }
    }
    case 'camera': {
      let point = mapply(toMatrix(obj.transforms), Vec(0,0,0))
      return { ...obj, center: point, r: 1 }
    }
    default: throw new Error('unknown object kind')
  }
}

export function compileScene(objects) {
  return objects.map(e => compileObject(e, objects))
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
