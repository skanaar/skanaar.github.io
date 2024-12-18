import { vnormalize, vcross, vdiff } from './math.js'

export function LatheModel(res, scale, path) {
  function point(i,j) {
    const a = j*Math.PI*2/res
    const [r, z] = path[i]
    return [scale*r*Math.cos(a), scale*r*Math.sin(a), scale*z]
  }
  const vertices = []
  const normals = []
  const indices = []
  let k = 0
  for (let i=1; i<path.length; i++) {
    for (let j=0; j<res; j++) {
      const a = point(i-1,j-1)
      const b = point(i,j-1)
      const c = point(i-1,j)
      const d = point(i,j)
      const n = vnormalize(vcross(vdiff(c,a), vdiff(b,a))).slice(0,3)
      if (isNaN(n[0])) console.error('lathe bad polygon', { i, j, a, b, c })
      vertices.push(...a)
      vertices.push(...b)
      vertices.push(...c)
      vertices.push(...b)
      vertices.push(...d)
      vertices.push(...c)
      normals.push(...n)
      normals.push(...n)
      normals.push(...n)
      normals.push(...n)
      normals.push(...n)
      normals.push(...n)
      indices.push(k, k+1, k+2)
      indices.push(k+3, k+4, k+5)
      k += 6
    }
  }
  return { count: k, vertices, normals, indices }
}
