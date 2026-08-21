import { Identity } from '../math.js'
import { latheMesh } from './lathe.js'
import { Mesh, Point } from '../objects.js'

export function LatheEditable(lathe) {
  let polys = latheMesh(lathe.path, lathe.res, 360, Identity())
  let points = lathe.path.map((p, i) => Point(`Point ${i+1}`, p))
  let parts = [Mesh(lathe.material, polys, { renderOnly: true }), ...points]
  return {
    kind: 'mesh',
    lathe,
    get path() { return this.parts.map(e => e.transforms.offset) },
    get polys() { return this.mesh.polys },
    get radius() { return this.mesh.radius },
    get center() { return this.mesh.center },
    parts,
    res: lathe.res,
    angle: lathe.angle,
    update() {
      lathe.res = this.res
      lathe.angle = this.angle
      lathe.path = this.parts
        .filter(e => e.kind == 'point')
        .map(e => e.transforms.offset)
      let polys = latheMesh(lathe.path, lathe.res, lathe.angle, Identity())
      this.parts[0] = Mesh(lathe.material, polys, { renderOnly: true })
    }
  }
}
