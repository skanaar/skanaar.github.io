import { seededRandom } from './rand.js'

var res = 256

function smoothstep(x) { return x*x*(3 - 2*x) }
function lerp(factor, a, b) { return a + (b - a) * factor }

export function Noise({ persistence = 0.5, octaves = 1, zoom = 1, rseed = 0 }) {
  var scale = zoom * 2
  var rand = seededRandom(rseed)
  var matrix = Array.from({ length: res }).map(() => rand() - 0.5)

  function getSingleOctave(x, y, z) {
    var x0 = Math.floor(x)
    var y0 = Math.floor(y)
    var z0 = Math.floor(z)
    var x1 = x0+1
    var y1 = y0+1
    var z1 = z0+1
    var ux = smoothstep(x - x0)
    var uy = smoothstep(y - y0)
    var uz = smoothstep(z - z0)
    var a = lerp(uy, val(x0, y0, z0), val(x0, y1, z0))
    var b = lerp(uy, val(x1, y0, z0), val(x1, y1, z0))
    let ab = lerp(ux, a, b)
    var c = lerp(uy, val(x0, y0, z1), val(x0, y1, z1))
    var d = lerp(uy, val(x1, y0, z1), val(x1, y1, z1))
    let cd = lerp(ux, c, d)
    return lerp(uz, ab, cd)
  }

  function val(x, y, z) {
    return matrix[Math.abs(1024 + x + 7*y + 17*z) % matrix.length]
  }

  return function (i, j, k) {
    let sum = 0.0
    let x = i/scale
    let y = j/scale
    let z = k/scale
    let amp = 1.0
    for (let index=0; index<octaves; index++) {
      sum = sum + amp * getSingleOctave(x, y, z)
      x *= 2
      y *= 2
      z *= 2
      amp = amp * persistence
    }
    return sum + 0.5
  }
}
