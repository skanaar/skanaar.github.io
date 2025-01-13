import { ImprovedNoise } from './ImprovedNoise.js'
import { Vec4, vdiff, vcross, vnormalize } from './math.js'

var perlin = ImprovedNoise()
function terrainHeightAt(x, y, sampleSize, height){
  const levelOfDetail = Math.round(8 - Math.log(sampleSize) / Math.LN2)
  return height*perlin(x, y, 128, levelOfDetail)
}

function array(count, value) {
  return [...new Array(count)].map((_, i) => value)
}

function get(terrain, i, j) {
  const res = terrain.length
  while (i<0) i += res
  while (j<0) j += res
  return terrain[i%res][j%res]
}

function interpolatedValue(terrain, x, z) {
  const i = Math.floor(x)
  const j = Math.floor(z)
  const a = get(terrain, i, j)
  const b = get(terrain, i+1, j)
  const c = get(terrain, i, j+1)
  const d = get(terrain, i+1, j+1)
  const u = x - i
  const v = z - j
  return (a*(1-u) + b*u)*(1-v) + (c*(1-u) + d*u)*v
}

function craterOffset(height, x){
  x = Math.min(x, 1)
  return height*(Math.pow(Math.sin(x*x*3),2) + (x*x-1)*1.1)
}

export function Terrain(res, { craters, height, scale }){
  const subdivs = Math.round(Math.log2(res))
  if (2**subdivs != res) throw new Error('resolution must be a power of 2')

  function addCrater(terrain, x, y, r, height){
    x = Math.round(x)
    y = Math.round(y)
    r = Math.round(r)
    var centerHeight = get(terrain, x, y) + height/3
    for (var i = -r; i < r; i++) {
      for (var j = -r; j < r; j++) {
        var coord = Math.sqrt(i*i+j*j) / r
        if (coord>1 || j+y<1 || j+y>res-1 || i+x<1 || i+x>res-1) continue
        var offset = -craterOffset(height, coord)
        var value = get(terrain, x+i, y+j)
        var smoothness = 0.97 + 0.03*coord
        terrain[x+i][y+j] = offset +
          (smoothness)*value +
          (1-smoothness)*centerHeight
      }
    }
  }

  function rand(min, max){
    return Math.random() * (max-min) + min
  }

  var terrain = array(res, 0).map(() => array(res, 0))

  for (var x = 0; x < res; x++) {
    for (var y = 0; y < res; y++) {
      const value = terrainHeightAt(scale*x, scale*y, 1, height)
      terrain[x][y] = value
    }
  }

  for (var c = 0; c<craters; c++){
    var size = 25 * Math.pow(rand(0.3,1), 2)
    var depth = height * 0.1 * size * rand(0.02,0.2)
    addCrater(terrain, rand(-10,res+10), rand(-10,res+10), size, depth)
  }

  return {
    point(i, j) {
      return Vec4(i, this.valueAt(i, j), j)
    },
    normal(i, j) {
      const dx = vdiff(this.point(i+1,j), this.point(i-1,j))
      const dy = vdiff(this.point(i,j+1), this.point(i,j-1))
      return vnormalize(vcross(dx, dy))
    },
    valueAt(i, j) {
      return interpolatedValue(terrain, i-res/2, j-res/2)
    },
  }
}
