var res = 256
var matrix = [...new Array(res)].map(() => Math.random() - 0.5)

export function Noise(conf) {
  var persistence = conf.persistence || 0.5
  var octaves = conf.octaves || 1
  var scale = conf.zoom * 2 || 2

  function smoothstep(x) { return x*x*(3 - 2*x) }

  function lerp(factor, a, b) { return a + (b-a)*factor }

  function getSingleOctave(x, y) {
    var x0 = Math.floor(x)
    var y0 = Math.floor(y)
    var x1 = x0+1
    var y1 = y0+1
    var ux = smoothstep(x - x0)
    var uy = smoothstep(y - y0)
    var yy0 = lerp(uy, val(x0, y0), val(x0, y1))
    var yy1 = lerp(uy, val(x1, y0), val(x1, y1))
    return lerp(ux, yy0, yy1)
  }

  function val(x, y) {
    return matrix[Math.abs(1024 + x + 7*y) % matrix.length]
  }

  return function (i, j) {
    var sum = 0.0
    var x = i/scale
    var y = j/scale
    var amp = 1.0
    for (var i=0; i<octaves; i++) {
      sum = sum + amp * getSingleOctave(x, y)
      x *= 2
      y *= 2
      amp = amp * persistence
    }
    return sum + 0.5
  }
}
