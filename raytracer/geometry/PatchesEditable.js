import { Identity } from '../math.js'
import { bezierMesh } from './bezier.js'
import { Mesh, Point } from '../objects.js'

function chunked(list, size) {
  let chunks = []
  for (let i = 0; i < list.length; i += size)
    chunks.push(list.slice(i, i + size))
  return chunks
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
