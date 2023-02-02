/* global Bacon*/
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
    87: 'up',
    65: 'left',
    83: 'down',
    68: 'right',
    // numpad arrows
    38: 'up',
    37: 'left',
    12: 'down',
    40: 'down',
    39: 'right',
    // numpad numbers
    104: 'up',
    100: 'left',
    101: 'down',
    102: 'right',
    49: 'weapon_shell',
    50: 'weapon_bullet',
    51: 'weapon_bomb'
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

  Bacon.fromEventTarget(document.body, 'keydown')
      .filter(function(e){ return e.keyCode in keyMap })
      .onValue(function(e) { return input[keyMap[e.keyCode]] = true; })

  Bacon.fromEventTarget(document.body, 'keyup')
      .filter(function(e){ return e.keyCode in keyMap })
      .onValue(function(e) { return input[keyMap[e.keyCode]] = false })

  Bacon.fromEventTarget(document.body, 'click').onValue(function() {
    input.fire = true
  })

  Bacon.fromEventTarget(document.body, 'mousemove')
      .onValue(function(e) {
      var scale = canvas.width / canvas.offsetWidth 
      var cursor = V.Vec(e.offsetX * scale, e.offsetY * scale)
      input.mouse = cursor
      var pointing = V.diff(cursor, world.units[0].pos)
      var d = V.mag(pointing)
      if (d > 200)
        pointing = V.mult(pointing, 200/d)
      input.aim = pointing
      })

  function update(){
    requestAnimationFrame(function(){

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
}