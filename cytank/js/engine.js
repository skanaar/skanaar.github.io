import { Canvas } from './skanaar.canvas.js'
import { World } from './game.js'
import { V } from './vector.js'
import { simulate } from './simulate.js'
import { render } from './render.js'
import { conduct } from './conduct.js'

export function start(canvas) {
  var g = new Canvas(canvas, {})
  var world = new World()

  var keyMap = {
    ArrowUp: 'up',
    ArrowLeft: 'left',
    ArrowDown: 'down',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyA: 'left',
    KeyS: 'down',
    KeyD: 'right',
    Digit1: 'weapon_shell',
    Digit2: 'weapon_bullet',
    Digit3: 'weapon_bomb'
  }

  var input = {
    up: false,
    left: false,
    down: false,
    right: false,
    fire: false,
    mouse: V.Vec(),
    aim: V.Vec()
  }

  function onKeyDown(e) {
    if (e.code in keyMap) input[keyMap[e.code]] = true
  }

  function onKeyUp(e) {
    if (e.code in keyMap) input[keyMap[e.code]] = true
  }

  function onClick() {
    input.fire = true
  }

  function onMouseMove(e) {
    var scale = canvas.width / canvas.offsetWidth
    var cursor = V.Vec(e.offsetX * scale, e.offsetY * scale)
    input.mouse = cursor
    var pointing = V.diff(cursor, world.units[0].pos)
    var d = V.mag(pointing)
    if (d > 200)
      pointing = V.mult(pointing, 200/d)
    input.aim = pointing
  }

  document.body.addEventListener('keydown', onKeyDown)
  document.body.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('click', onClick)
  canvas.addEventListener('mousemove', onMouseMove)

  var handle = {
    isPaused: false,
    dispose() {
      document.body.removeEventListener('keydown', onKeyDown)
      document.body.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousemove', onMouseMove)
    }
  }

  function update(){
    requestAnimationFrame(function(){
      if (handle.isPaused) return

      var pad = navigator.getGamepads()[0]
      if (pad){
        input.fire = pad.buttons[7].pressed
        input.up = pad.buttons[0].pressed
        input.left = pad.axes[0] < -0.3
        input.right = pad.axes[0] > 0.3
        var aim = V.Vec(pad.axes[2]*300, pad.axes[3]*300)
        input.aim = V.add(V.mult(input.aim, 0.95), V.mult(aim, 0.05))
        var target = V.add(world.units[0].pos, aim)
        input.mouse = V.add(V.mult(input.mouse, 0.95), V.mult(target, 0.05))
      }

      simulate(world, 0.025)
      conduct(world, input, 0.025)
      render(world, input, g)

      input.fire = false
    })
  }
  setInterval(update, 25)

  update()

  return handle
}
