import { PerspectiveMatrix, RotateX, RotateY, TranslateMatrix, vcross, vdiff, vnormalize } from './math.js'
import { Vec4, normalize, mmult } from './math.js'
import { generateLandscape } from './landscape.js'
import { quad } from './quadtree.js'
import { GLContext } from './GLContext.js'

export function Engine(canvas, vertexSrc, fragmentSrc) {
  const gl = canvas.getContext('webgl2')
  const ctx = GLContext(gl, vertexSrc, fragmentSrc)
  const model = buildGrid(ctx, 256, 6, 5, 2)

  return {
    render(t, u) {
      drawScene(ctx, model, t, u)
    },
    dispose() {}
  }
}
//------------------------
function buildGrid(ctx, res, freq, width, height) {
  var quadtree = generateLandscape(res)
  function point(i,j) {
    return [
      width * (i/res-.5),
      -height * quad.at(quadtree, i, j).value/60,//(Math.cos(freq*i/res)*Math.sin(freq*j/res)),
      width * (j/res-.5)
    ]
  }
  const verts = []
  for (var i=0; i<res; i++) {
    for (var j=0; j<res; j++) {
      verts.push(...point(i,j))
    }
  }
  const norms = []
  for (var i=0; i<res; i++) {
    for (var j=0; j<res; j++) {
      const dx = vdiff(point(i+1,j), point(i-1,j))
      const dy = vdiff(point(i,j+1), point(i,j-1))
      norms.push(...vnormalize(vcross(dx, dy)))
    }
  }
  const indices = []
  for (var i=0; i<res-1; i++) {
    for (var j=0; j<res-1; j++) {
      const k = i + res*j
      indices.push(k, k+1, k+1+res)
      indices.push(k, k+1+res, k+res)
    }
  }
  return {
    count: (res-1)*(res-1)*2*3,
    vertices: ctx.createVec3Buffer(verts),
    normals: ctx.createVec3Buffer(norms),
    indices: ctx.createIndexBuffer(indices),
  }
}
//------------------------
function drawScene(ctx, geometry, t, u) {
  ctx.clear()

  ctx.bindVector('uSun', normalize(Vec4(1,0.5,0.5)))
  ctx.bindMatrix('uProjection', PerspectiveMatrix(.25*3.14, 500/375, 0.1, 1000))
  ctx.bindMatrix(
    'uModelView',
    mmult(mmult(TranslateMatrix(0,0,-6), RotateX(t)), RotateY(u))
  )

  ctx.draw(geometry)
}
