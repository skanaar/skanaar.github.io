import { vnormalize, vcross, vdiff, vadd, Vec4 } from './math.js'
//    b      c
// a   f
//  e       d
export function ChassiModel(s = 0.33, width = 1) {
  const a = Vec4(-s*3, 0, 0)
  const b = Vec4(-s*1, 0, -s*2)
  const c = Vec4(s*5, 0, -s*2)
  const d = Vec4(s*4, 0, s*1)
  const e = Vec4(-s*2.5, 0, s*1)
  const f = Vec4(0, 0, 0)
  const points = [
    vadd(f, Vec4(0, 2*s*width, 0)),  // 0 F
    vadd(a, Vec4(0, s*width, 0)),    // 1 A
    vadd(b, Vec4(0, s*width, 0)),    // 2
    vadd(c, Vec4(0, s*width, 0)),    // 3
    vadd(d, Vec4(0, s*width, 0)),    // 4
    vadd(e, Vec4(0, s*width, 0)),    // 5
    vadd(a, Vec4(0, -s*width, 0)),   // 6 A
    vadd(b, Vec4(0, -s*width, 0)),   // 7
    vadd(c, Vec4(0, -s*width, 0)),   // 8
    vadd(d, Vec4(0, -s*width, 0)),   // 9
    vadd(e, Vec4(0, -s*width, 0)),   // 10
    vadd(f, Vec4(0, -2*s*width, 0)), // 11 F
  ]
  const indices = [
    0,1,2,
    0,2,3,
    0,3,4,
    0,4,5,
    0,5,1,
    1,6,7, 2,1,7,
    2,7,8, 3,2,8,
    3,8,9, 4,3,9,
    4,9,10, 5,4,10,
    5,10,6, 5,6,1,
    11,7,6,
    11,8,7,
    11,9,8,
    11,10,9,
    11,6,10,
  ]
  const normals = []
  for (let i=0; i<indices.length; i+=3) {
    let u = vdiff(points[indices[i+2]], points[indices[i]])
    let v = vdiff(points[indices[i+1]], points[indices[i]])
    let [nx,ny,nz] = vnormalize(vcross(u,v)).slice(0,3)
    normals.push(nx, ny, nz)
    normals.push(nx, ny, nz)
    normals.push(nx, ny, nz)
  }
  const vertices = points.flatMap(e => [...e.slice(0,3)])
  return { count: 60, vertices, normals, indices }
}
