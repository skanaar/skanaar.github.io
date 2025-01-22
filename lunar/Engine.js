import { Identity, mmult, Perspective, RotateX, RotateY, RotateZ, Translate } from './math.js'
import { Vec4, vnormalize, mmults, vdiff, vadd, vmult } from './math.js'
import { Terrain } from './Terrain.js'
import { LandscapeModel } from './LandscapeModel.js'
import { LatheModel } from './LatheModel.js'
import { GLContext } from './GLContext.js'
import { Input } from './Input.js'
import { Rover } from './Rover.js'
import { ChassiModel } from './MeshModel.js'

export function Engine(canvas, vertexSrc, fragmentSrc) {
  const config = {
    viewDistance: 10
  }
  let yaw = 1.97
  let pitch = 2.75
  const input = new Input()
  const gl = canvas.getContext('webgl2')
  const ctx = GLContext(gl, vertexSrc, fragmentSrc)
  const wheel = ctx.prepareModel(LatheModel(12, .05, [
    [4,0],[8,-5],[10,-3],[10,3],[8,5],[4,0]
  ]))
  const chassiModel = ctx.prepareModel(ChassiModel())
  const terrain = Terrain(256, {
    noiseFalloff: 0.4,
    craters: 70,
    height: 20,
    scale: 0.75
  })
  const landscape = ctx.prepareModel(LandscapeModel(terrain, 256))
  const rover = new Rover(terrain.valueAt(0, 0) - 1)

  let animationCallback = null
  let previous = null
  let focus = Vec4(0,0,0)

  function render(millis) {
    const delta = (previous != null) ? (millis - previous)/1000 : 0
    if (input.up) pitch -= 2. * delta
    if (input.down) pitch += 2. * delta
    if (input.left) yaw += 2. * delta
    if (input.right) yaw -= 2. * delta
    if (input.isPressed('r')) config.viewDistance *= 0.98
    if (input.isPressed('f')) config.viewDistance *= 1/0.98
    if (input.isPressed('w')) rover.driveDirection = 1
    else if (input.isPressed('s')) rover.driveDirection = -1
    else rover.driveDirection = 0
    if (input.isPressed('a')) rover.turn += 0.008
    if (input.isPressed('d')) rover.turn -= 0.008
    rover.turn *= 0.98

    if (delta > 0 && delta < 0.1) {
      rover.simulateForces(terrain, delta*1.)
      if (millis%200 < previous%200) engine.onDebugData(getDebugInfo(rover))
      rover.apply(delta)
    }
    previous = millis

    const glue = 1.0
    const roverCenter = vmult(0.25, rover.wheels.map(e => e.pos).reduce(vadd))
    focus = vadd(vmult(1-glue, focus), vmult(glue, roverCenter))

    const ws = rover.wheels
    const forward = rover.forward
    const ry = Math.atan2(forward[2], forward[0])
    const rz = Math.atan2(forward[1], forward[0])
    const objects = [
      ...ws.map(e => ({
        model: wheel,
        transform: mmults(RotateY(e.turnAngle), RotateZ(e.rotation)),
        translate: e.transform,
        shadow: e.pos,
      })),
      {
        model: chassiModel,
        transform: mmults(RotateY(ry), RotateZ(-rz), RotateX(Math.PI/2)),
        translate: rover.chassi.transform
      },
      { model: landscape, transform: Identity(), translate: Identity() },
    ]
    drawScene(ctx, focus, objects, config, pitch, yaw)
    animationCallback = requestAnimationFrame(render)
  }

  const engine = {
    config,
    onDebugData: () => {},
    start() {
      render(0)
    },
    dispose() {
      cancelAnimationFrame(animationCallback)
      input.dispose()
    }
  }

  return engine
}

function getDebugInfo(rover) {
  return {
    drive: rover.drive,
    driveDirection: rover.driveDirection,
    forward: rover.forward,
    ...rover.wheels[1],
    force: [...rover.wheels[1].force]
  }
}
//------------------------
function drawScene(ctx, focus, objects, { viewDistance }, t, u) {
  ctx.clear()
  ctx.bindVector('uSun', vnormalize(Vec4(1,0.5,0.5)))
  ctx.bindVector('uShadower1', objects[0].shadow)
  ctx.bindVector('uShadower2', objects[1].shadow)
  ctx.bindVector('uShadower3', objects[2].shadow)
  ctx.bindVector('uShadower4', objects[3].shadow)
  ctx.bindMatrix(
    'uProjection',
    mmults(
      Perspective(.25*3.14, 4/3, 0.1, 1000),
      Translate(0,0,-viewDistance),
      RotateX(t),
      RotateY(u),
      Translate(-focus[0],-focus[1],-focus[2]),
    )
  )
  for (const { model, transform, translate } of objects) {
    ctx.bindMatrix('uModelView', transform)
    ctx.bindMatrix('uModelTranslation', translate)
    ctx.draw(model)
  }
}
