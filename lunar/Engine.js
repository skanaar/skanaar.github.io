import { IdentityMatrix, PerspectiveMatrix, RotateX, RotateY, TranslateMatrix } from './math.js'
import { Vec4, normalize, mmults } from './math.js'
import { LandscapeModel } from './landscape.js'
import { GLContext } from './GLContext.js'

export function Engine(canvas, vertexSrc, fragmentSrc) {
  const gl = canvas.getContext('webgl2')
  const ctx = GLContext(gl, vertexSrc, fragmentSrc)
  const model = ctx.prepareModel(LandscapeModel(256, 5, 2))

  return {
    render(t, u) {
      drawScene(ctx, model, t, u)
    },
    dispose() {}
  }
}
//------------------------
function drawScene(ctx, model, t, u) {
  ctx.clear()
  ctx.bindVector('uSun', normalize(Vec4(1,0.5,0.5)))
  ctx.bindMatrix(
    'uProjection',
    mmults(
      PerspectiveMatrix(.25*3.14, 4/3, 0.1, 1000),
      TranslateMatrix(0,0,-6),
      RotateX(t),
      RotateY(u),
    )
  )
  ctx.bindMatrix('uModelView', mmults(IdentityMatrix()))
  ctx.draw(model)
}
