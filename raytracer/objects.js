import { add, diff, mult, mag, Vec } from './math.js'

export function Offset(x, y, z) { return { x, y, z } }
export function Rotate(x, y, z) { return { x, y, z } }
export function Scaling(x, y, z) { return { x: dec(x), y: dec(y), z: dec(z) } }
function dec(x) { return +(x.toFixed(2)) }

export function Transforms(offset, rotate, scale = Scaling(1,1,1)) {
  return { offset, rotate: rotate ?? Rotate(0,0,0), scale }
}

export function Mesh(material, polys, ops = {}) {
  const verts = polys
    .flatMap(({ a, b, c }) => [a, b, c])
  let sum = verts.reduce((acc, e) => add(acc,e), Vec(0,0,0))
  let center = verts.length ? mult(1/verts.length, sum) : Vec(0,0,0)
  let radius = verts.reduce((max,p) => Math.max(mag(diff(center,p)), max), 0)
  let renderOnly = ops.renderOnly
  return { kind: 'mesh', material, polys, center, radius, renderOnly }
}

export function NullObject() {
  return { kind: 'null' }
}

export function Scene(parts) {
  return { kind: 'scene', parts }
}

export function Point(name, pos) {
  return { kind: 'point', name, transforms: Transforms(pos) }
}

let camId = 0
export function Camera(transforms, id) {
  return { kind: 'camera', id: id ?? camId++, name: 'camera', transforms }
}

export function Link(source, target, x, y, w, h) {
  return { kind: 'link', name: 'link', source, target, x, y, w, h }
}

export function Material(name, materialKind, shade1, shade2 = 1, zoom = 1) {
  return { kind: 'material', name, materialKind, shade1, shade2, zoom }
}

export function Composite(name, parts, transforms) {
  return { kind: 'composite', name, parts, material: 'diffuse', transforms }
}
export let compositeCompatibles =
  new Set(['box', 'lathe', 'tree', 'heightmap', 'bezierlathe', 'patches']);

export function Instance(name, ref, transforms) {
  return { kind: 'instance', name, ref, transforms }
}
export const instanceCompatibles = new Set([
  'box', 'lathe', 'tree', 'heightmap', 'bezierlathe', 'patches', 'composite'
]);

export function Light(amount, offset) {
  return { kind: 'light', amount, transforms: Transforms(offset) }
}

export function Sphere(name, material, transforms) {
  return { kind: 'sphere', name, material, transforms }
}

export function Box(name, transforms, material = 'diffuse') {
  return { kind: 'box', name, material, transforms }
}

export function Lathe(name, res, angle, path, transforms) {
  let material = 'diffuse'
  return { kind: 'lathe', name, material, angle, path, res, transforms }
}

export function BezierLathe(name, resU, resV, path, transforms) {
  let material = 'diffuse'
  return { kind: 'bezierlathe', name, material, path, resU, resV, transforms }
}

export function BezierPatchSet(name, patches, res, transforms) {
  return { kind: 'patches', name, material:'diffuse', patches, res, transforms }
}

export function HeightMap(name, opts, transforms, material = 'diffuse') {
  let { res, rseed, zoom, isola, persistence, octaves, threshold = -1 } = opts
  return {
    kind: 'heightmap',
    name, res, rseed, zoom, isola, persistence, octaves, threshold,
    transforms, material
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

function isMeshable(kind) { return ['light', 'camera'].includes(kind) }

export function createObject(kind, pos, selected, scene) {
  let withSize = (s) => Transforms(pos, Rotate(0, 0, 0), Scaling(s, s, s))

  let l = 100
  switch (kind) {
    case 'light': return Light(64, pos)
    case 'camera': return Camera(withSize(1))
    case 'link': return Link(-1, -1, 30, 30, 30, 30)
    case 'box': return Box('box', withSize(1))
    case 'lathe':
      return Lathe('cylinder', 16, 360, [Vec(l,-l,0),Vec(l,l,0)], withSize(1))
    case 'sphere': return Sphere('sphere', 'diffuse', withSize(30))
    case 'tree': return Tree('tree', {}, withSize(1))
    case 'heightmap':
      return HeightMap('terrain', {
        res: 16, isola: 0, seed: 0, zoom: 10, persistence: 0.5, octaves: 3
      }, withSize(100))
    case 'composite':
      return Composite('composite', [createObject('box', pos)], withSize(1))
    case 'instance':
      let ref = isMeshable(selected?.kind) ? null : (selected?.name ?? null)
      return Instance('instance', ref, withSize(1))
    case 'point':
      return Point(`Point ${scene.parts.length + 1}`, withSize(1).offset)
    case 'material':
      return Material(`Material ${scene.parts.length + 1}`, 'solid', 0, 1, 5)
    default: throw new Error('unknown object kint: ' + kind)
  }
}
