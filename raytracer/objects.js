import { add, diff, mult, mag } from './math.js'

export function Offset(x, y, z) { return { x, y, z } }
export function Rotate(x, y, z) { return { x, y, z } }
export function Scaling(x, y, z) { return { x: dec(x), y: dec(y), z: dec(z) } }
function dec(x) { return +(x.toFixed(2)) }

export function Transforms(offset, rotate, scale = Scaling(1,1,1)) {
  return { offset, rotate: rotate ?? Rotate(0,0,0), scale }
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

export function Light(amount, offset) {
  let transforms = Transforms(offset, Rotate(0,0,0), Scaling(1,1,1))
  return { kind: 'light', amount, transforms }
}

export function Sphere(name, material, transforms) {
  return { kind: 'sphere', name, material, transforms }
}

export function Box(name, transforms) {
  return { kind: 'box', name, material: 'diffuse', transforms }
}

export function Lathe(name, res, path, transforms) {
  return { kind: 'lathe', name, material: 'diffuse', path, res, transforms }
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
