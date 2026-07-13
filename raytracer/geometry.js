import { Vec, mapply, mag, diff } from './math.js'
import { Scale, Translate, RotateX, RotateY, RotateZ, π, matrixStack } from './math.js'
import { transformTriangle } from './geometry/polygon.js'
import { Offset, Transforms, Mesh, NullObject } from './objects.js'

export function toMatrix({ offset, rotate, scale }) {
  return matrixStack(
    Translate(offset.x, offset.y, offset.z),
    RotateX(rotate.x * π/180),
    RotateY(rotate.y * π/180),
    RotateZ(rotate.z * π/180),
    Scale(scale.x, scale.y, scale.z),
  )
}
import { boxMesh } from './geometry/box.js'
import { latheMesh } from './geometry/lathe.js'
import { bezierMesh, bezierLatheMesh } from './geometry/bezier.js'
import { heightMapMesh } from './geometry/heightmap.js'
import { treeMesh } from './geometry/tree.js'

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
    case 'box': return Mesh(
      obj.material,
      boxMesh(toMatrix(obj.transforms))
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
    case 'instance': {
      let template = objects.find(e => e.name == obj.ref)
      if (!obj.ref || !template) return NullObject()
      template = { ...template, transforms: Transforms(Offset(0,0,0)) }
      // TODO: support for non-mesh objects here
      let mesh = compileObject(template, template.children ?? []).polys
      return Mesh(
        template.material,
        mesh.map(p => transformTriangle(p, toMatrix(obj.transforms)))
      )
    }
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
