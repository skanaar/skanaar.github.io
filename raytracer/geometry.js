import { Vec, Scale, Translate, RotateX, RotateY, RotateZ, π } from './math.js'
import { sq, add, cross, diff, norm, mult, rotx, mapply, mag } from './math.js'
import { generateRowByRowCoordinates, matrixStack, Identity } from './math.js'
import { Noise } from './noise.js'

export function Offset(x,y,z) { return { x, y, z } }
export function Rotate(x,y,z) { return { x, y, z } }
export function Scaling(x, y, z) { return { x: dec(x), y: dec(y), z: dec(z), } }
function dec(x) { return +(x.toFixed(2)) }
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

export function Scene(children) {
  return { kind: 'scene', children }
}

export function Point(name, pos) {
  return { kind: 'point', name, transforms: Transforms(pos) }
}

export function Camera(transforms) {
  return { kind: 'camera', name: 'camera', transforms }
}

export function Composite(name, children, transforms) {
  return { kind: 'composite', name, children, transforms }
}

export function Instance(name, ref, transforms) {
  return { kind: 'instance', name, ref, transforms }
}

export function Mesh(material, polys, ops = {}) {
  const vertices = polys
    .flatMap(({ a, b, c }) => [a, b, c])
  let center = mult(1/vertices.length, vertices.reduce((acc, e) => add(acc,e)))
  let radius = vertices.reduce((max,p) => Math.max(mag(diff(center,p)), max), 0)
  let renderOnly = ops.renderOnly
  return { kind: 'mesh', material, polys, center, radius, renderOnly }
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

export function LatheEditable(lathe) {
  let polys = latheMesh(lathe.path, lathe.res, Identity())
  let points = lathe.path.map((p, i) => Point(`Point ${i+1}`, p))
  let children = [Mesh(lathe.material, polys, { renderOnly: true }), ...points]
  return {
    kind: 'mesh',
    lathe,
    get path() { return this.children.map(e => e.transforms.offset) },
    get polys() { return this.mesh.polys },
    get radius() { return this.mesh.radius },
    get center() { return this.mesh.center },
    children,
    res: lathe.res,
    update() {
      lathe.res = this.res
      lathe.path = this.children
        .filter(e => e.kind == 'point')
        .map(e => e.transforms.offset)
      let polys = latheMesh(lathe.path, lathe.res, Identity())
      this.children[0] = Mesh(lathe.material, polys, { renderOnly: true })
    }
  }
}

export function PatchesEditable(obj) {
  let polys = bezierMesh(obj.patches, obj.res, Identity())
  let points = obj.patches
    .flatMap((patch, i) => patch.map((p, j) => Point(`Patch ${i} p${j}`, p)))
  let children = [Mesh(obj.material, polys, { renderOnly: true }), ...points]
  return {
    kind: 'mesh',
    patches: obj,
    get polys() { return this.mesh.polys },
    get radius() { return this.mesh.radius },
    get center() { return this.mesh.center },
    children,
    res: obj.res,
    update() {
      obj.res = this.res
      obj.patches = chunked(this.children
        .filter(e => e.kind == 'point')
        .map(e => e.transforms.offset), 16)
      let polys = bezierMesh(obj.patches, obj.res, Identity())
      this.children[0] = Mesh(obj.material, polys, { renderOnly: true })
    }
  }
}

export function chunked(list, size) {
  let chunks = []
  for (let i = 0; i < list.length; i += size)
    chunks.push(list.slice(i, i + size))
  return chunks
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

export function HeightMap(name, opts, transforms) {
  let { res, zoom, isola, persistence, octaves, threshold = -1 } = opts
  return {
    kind: 'heightmap',
    name, res, zoom, isola, persistence, octaves, threshold,
    transforms
  }
}

export function Tree(name, opts, transforms) {
  let {
    branches = 3,
    leafCount = 3,
    trunkWidth = 28,
    branchLength = 0.75,
    iterations = 3,
    branchAngle = 45,
    angleRandomness = 20,
    randomSeed = 1,
  } = opts
  return {
    kind: 'tree', name, material: 'diffuse',
    branches, trunkWidth, branchLength, leafCount,
    iterations, branchAngle, angleRandomness, randomSeed,
    transforms,
  }
}

export function compileObject(obj, objects) {
  switch (obj.kind) {
    case 'mesh': return obj
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
      let l = 10
      let o = -10
      let a0 = Vec(o,o,o), b0 = Vec(l,o,o), c0 = Vec(o,l,o), d0 = Vec(l,l,o)
      let a1 = Vec(o,o,l), b1 = Vec(l,o,l), c1 = Vec(o,l,l), d1 = Vec(l,l,l)
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
    case 'tree': return Mesh(
      obj.material,
      treeMesh(obj, toMatrix(obj.transforms))
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
    case 'point': {
      let point = mapply(toMatrix(obj.transforms), Vec(0,0,0))
      return { kind: 'point', center: point }
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

// Deterministic PRNG (mulberry32)
function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function perpendicularAxes(dir) {
  let ref = Math.abs(dir.z) < 0.9 ? Vec(0,0,1) : Vec(0,1,0)
  let u = norm(cross(ref, dir))
  let v = cross(dir, u)
  return [u, v]
}

export function treeMesh(opts, matrix) {
  let {
    branches, trunkWidth, branchLength, leafCount,
    iterations, branchAngle, angleRandomness, randomSeed,
  } = opts
  let trunkLength = 100
  let trunkTop = trunkWidth / 2
  let taper = 0.5
  let angle = branchAngle * Math.PI / 180
  let rand = seededRandom(randomSeed)
  let leafRand = seededRandom(randomSeed)
  let jitter = (amount) => (amount * 2 - 1) * angleRandomness * Math.PI / 180
  let mesh = []

  function frustum(res, base, top, dir, rBase, rTop) {
    let [u, v] = perpendicularAxes(dir)
    let ring = (center, r, i) => {
      let a = 2 * Math.PI * i / res
      return add(center, mult(r, add(mult(Math.cos(a),u), mult(Math.sin(a),v))))
    }
    for (let i = 0; i < res; i++) {
      let b0 = ring(base, rBase, i), b1 = ring(base, rBase, i+1)
      let t0 = ring(top, rTop, i), t1 = ring(top, rTop, i+1)
      mesh.push(Polygon(b0, t0, t1))
      mesh.push(Polygon(b0, t1, b1))
    }
  }

  function leaves(tip, dir, size) {
    let [u, v] = perpendicularAxes(dir)
    let halfWidth = size * 0.35
    for (let l = 0; l < leafCount; l++) {
      let az = 2 * Math.PI * l / leafCount + jitter(leafRand())
      let tilt = 90 * Math.PI / 180 + jitter(leafRand())
      let side = add(mult(Math.cos(az), u), mult(Math.sin(az), v))
      let leafDir = norm(
        add(mult(Math.cos(tilt), dir), mult(Math.sin(tilt), side))
      )
      let far = add(tip, mult(size, leafDir))
      let perp = norm(cross(leafDir, dir))
      let b = add(far, mult(halfWidth, perp))
      let c = add(far, mult(-halfWidth, perp))
      mesh.push(Polygon(tip, b, c))
      mesh.push(Polygon(tip, c, b))
    }
  }

  function branch(base, dir, res, length, rBase, rTop, depth) {
    let top = add(base, mult(length, dir))
    frustum(res, base, top, dir, rBase, rTop)
    if (depth <= 0) {
      leaves(top, dir, length*0.7)
      return
    }
    let [u, v] = perpendicularAxes(dir)
    for (let k = 0; k < branches; k++) {
      let az = 2 * Math.PI * k / branches + jitter(rand())
      let tilt = angle + jitter(rand())
      let side = add(mult(Math.cos(az), u), mult(Math.sin(az), v))
      let childDir = norm(
        add(mult(Math.cos(tilt), dir), mult(Math.sin(tilt), side))
      )
      const len = length * branchLength
      branch(top, childDir, Math.max(3,res/2), len, rTop, rTop * taper, depth-1)
    }
  }

  let zero = Vec(0,0,0)
  branch(zero, Vec(0,-1,0), 12, trunkLength, trunkWidth, trunkTop, iterations)
  return mesh.map(p => transformTriangle(p, matrix))
}

export function heightMapMesh(opts, matrix) {
  const { res, zoom, isola, octaves, persistence, threshold } = opts
  const noise = Noise({ persistence, octaves, zoom: zoom / 100 })
  let above = (p) => p.a.y > threshold || p.b.y > threshold || p.c.y > threshold
  let point = (i, j) => {
      let r = 2 * (Math.sqrt(sq((i-res/2) / res) + sq((j-res/2) / res)))
      let island = isola * (r < 1 ? Math.cos(3.14 * r) + 1 : 0) + (1-isola) * 1
      return Vec(
        (i / res - 0.5),
        noise(i/res, j/res) * island,
        (j / res - 0.5)
      )
    }
  return [...generateRowByRowCoordinates(res)].flatMap(({ x: i, y: j }) => [
    Polygon(point(i, j), point(i + 1, j), point(i, j + 1)),
    Polygon(point(i + 1, j), point(i + 1, j + 1), point(i, j + 1)),
  ])
  .filter(isValidPolygon)
  .filter(above)
  .map(p => transformTriangle(p, matrix))
}
