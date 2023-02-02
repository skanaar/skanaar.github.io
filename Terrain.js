import { el, Button, App } from './assets/system.js'

export const app = new App('Terrain', Terrain, 'landscape.svg', [650, 400], 'noresize')

export function Terrain() {
  
  const [selected, setSelected] = React.useState(0)
  const surface = surfaces[selected]

  function changeSelected(delta) {
    setSelected((selected + delta + surfaces.length) % surfaces.length)
  }
  
  const mesh = drawTerrain(surface)
  
  return el(
    'terrain-viewer',
    {},
    el('style', {}, `
      terrain-viewer { background:#000; display:block; margin:-10px }
      terrain-viewer .canvas-3d { display:block }
      terrain-viewer footer {
        display: flex; justify-content: space-between;
        position: absolute; left: 10px; right: 10px; bottom: 10px;
      }
    `),
    el('svg', { width: 650, height: 400, className: 'canvas-3d', viewBox: '100 50 600 400' },
      mesh.map((e, i) => el('path', {
        key: `${i}`,
        d: `M${e.a.x},${e.a.y} L${e.b.x},${e.b.y} L${e.c.x},${e.c.y} L${e.d.x},${e.d.y} Z`,
        fill: `#${e.fill}`
      })),
    ),
    el('footer', {},
    el(Button, { onClick: () => changeSelected(-1) }, '<'),
    el(Button, { onClick: () => changeSelected(+1) }, '>'),
  ),
  )
}

function Vec(x,y){ return {x:x, y:y} }
function add(a,b){ return { x: a.x + b.x, y: a.y + b.y } }
function mult(v,factor){ return { x: factor*v.x, y: factor*v.y } }
function mag(v){ return Math.sqrt(v.x*v.x + v.y*v.y) }
function rotate(v, a){
  return {
    x: v.x*Math.cos(a) - v.y*Math.sin(a),
    y: v.x*Math.sin(a) + v.y*Math.cos(a)
  }
}

function toHex(x){ return constrain(0, 16, Math.round(x)).toString(16) }

function colorLerp(c1, c2, factor){
  return [
    toHex(lerp([parseInt(c1[0], 16), parseInt(c2[0], 16)], factor)),
    toHex(lerp([parseInt(c1[1], 16), parseInt(c2[1], 16)], factor)),
    toHex(lerp([parseInt(c1[2], 16), parseInt(c2[2], 16)], factor))
  ].join('')
}

function constrain(min, max, x) { return Math.min(max, Math.max(min, x)) }

function lerp(values, x) {
  var a = constrain(0, 0.999, x)
  var k = (a*(values.length-1)) % 1
  var i = Math.floor(a*(values.length-1))
  var c1 = values[i]
  var c2 = values[i+1]
  return c1*(1-k) + c2*k
}

function spectrumSample(spectrum, x){
  const r = toHex(lerp(spectrum.map(x => parseInt(x[0],16)), x))
  const g = toHex(lerp(spectrum.map(x => parseInt(x[1],16)), x))
  const b = toHex(lerp(spectrum.map(x => parseInt(x[2],16)), x))
  return [r, g, b].join('')
}

function drawTerrain(style){
  var center = Vec(400, 250)
  var radius = 300
  var angle = 0.3
  var res = 20
  var shadow = '000'

  var noise = Noise({ persistence: style.falloff, octaves: style.octaves, zoom: 0.2 })

  function terrainPoint(i, j, h){
    var p = rotate(mult(Vec(i-res, j-res), radius/res), angle)
    return Vec(p.x, p.y/2 - h * style.height*40/style.zoom)
  }

  var terrain = []
  for(var i=0; i<2*res+1; i++){
    terrain.push([])
    for(var j=0; j<2*res+1; j++){
      terrain[i][j] = noise(Vec(i*style.zoom/res, j*style.zoom/res))
      terrain[i][j] = lerp(style.curve, terrain[i][j])
    }
  }
  
  function sq(x) { return x * x }

  const mesh = []

  for(let i=0; i<2*res; i++){
    for(let j=0; j<2*res; j++){
      if (sq(i-res) + sq(j-res) > sq(res)) continue
      var sunAngle = 0.75 + (terrain[i][j]-terrain[i+1][j])*res/15
      var color = colorLerp(shadow, spectrumSample(style.spectrum, terrain[i][j]), sunAngle)
      var alpha = constrain(0, 1, 0.25*(res - mag(Vec(i-res+0.5, j-res+0.5))))
      mesh.push({
        a: add(center, terrainPoint(i+0, j+0, terrain[i+0][j+0]-0.3)),
        b: add(center, terrainPoint(i+1, j+0, terrain[i+1][j+0]-0.3)),
        c: add(center, terrainPoint(i+1, j+1, terrain[i+1][j+1]-0.3)),
        d: add(center, terrainPoint(i+0, j+1, terrain[i+0][j+1]-0.3)),
        fill: color + toHex(15 * alpha)
      })
    }
  }
  
  return mesh
}

function Noise(conf) {
  var res = 256
  var persistence = conf.persistence || 0.5
  var octaves = conf.octaves || 1
  var scale = conf.zoom * 2 || 2
  var matrix = [...new Array(res)].map(() => Math.random() - 0.5)

  function smoothstep(x) { return x*x*(3 - 2*x) }

  function lerp(factor, a, b) { return a + (b-a)*factor }
  
  function getSingleOctave(p) {
    var x0 = Math.floor(p.x)
    var y0 = Math.floor(p.y)
    var x1 = x0+1
    var y1 = y0+1
    var ux = smoothstep(p.x - x0)
    var uy = smoothstep(p.y - y0)
    var yy0 = lerp(uy, val(x0, y0), val(x0, y1))
    var yy1 = lerp(uy, val(x1, y0), val(x1, y1))
    return lerp(ux, yy0, yy1)
  }
  
  function val(x, y) {
    return matrix[Math.abs(1024 + x + 7*y) % matrix.length]
  }

  return function (p) {
    var sum = 0.0
    var pos = mult(p, 1/scale)
    var amp = 1.0
    for (var i=0; i<octaves; i++) {
      sum = sum + amp * getSingleOctave(pos)
      pos = mult(pos, 2)
      amp = amp * persistence
    }
    return sum + 0.5
  }
}

var surfaces = [
  {name:"planet-badlands-1",radius:20,ambient:0.1,zoom:1.1,height:2,octaves:4,falloff:0.45,curve:[0,0.2,1],spectrum:["6A0","FF8","884"]},
  {name:"planet-badlands-2",radius:20,ambient:0.1,zoom:0.4,height:1,octaves:4,falloff:0.6,curve:[0,1],spectrum:["444","450","898","FFF"]},
  {name:"planet-badlands-3",radius:17,ambient:0,zoom:0.4,height:0.9,octaves:4,falloff:0.6,curve:[0.5,0.75,0.9,0.25,0],spectrum:["431","540","898","BA9"]},
  {name:"planet-beach",radius:10,ambient:0.1,zoom:1.2,height:2,octaves:3,falloff:0.3,curve:[0.7,0.5,0.2,0,0,0],spectrum:["46F","FF8","FF8","884","884"]},
  {name:"planet-blue-forest",radius:15,ambient:0.1,zoom:1.5,height:2,octaves:3,falloff:0.2,curve:[0,0.65,1],spectrum:["20F","28F","4AF"]},
  {name:"planet-blue-ocean",radius:18,ambient:0.2,zoom:1.2,height:2,octaves:2,falloff:0.2,curve:[0,0,0.2,1],spectrum:["20F","2FA","4AF","4AF"]},
  {name:"planet-green-1",radius:20,ambient:0.1,zoom:0.7,height:2,octaves:4,falloff:0.5,curve:[0,0.3,0.3,0.4,0.8,1],spectrum:["05F","4B4","3B8","888"]},
  {name:"planet-green-2",radius:15,ambient:0.1,zoom:1,height:2,octaves:2,falloff:0.2,curve:[1,0,1],spectrum:["040","0F4","FF0"]},
  {name:"planet-green-3",radius:10,ambient:0.1,zoom:1.5,height:2,octaves:2,falloff:0.2,curve:[1,0,0.5],spectrum:["4F0","FF8","FF8","884","884"]},
  {name:"planet-green-4",radius:10,ambient:0.1,zoom:0.5,height:1,octaves:4,falloff:0.65,curve:[0,1],spectrum:["04F","0F0","8D0","FFF"]},
  {name:"planet-green-5",radius:14,ambient:0.1,zoom:1,height:2,octaves:4,falloff:0.5,curve:[0.1,0.2,0.3,0.33,0.37,0.4,0.6,0.8,0.9,1],spectrum:["040","0F0","8D0","F88"]},
  {name:"planet-green-6",radius:15,ambient:0.1,zoom:1,height:2,octaves:3,falloff:0.5,curve:[0,0.2,0.4,0.6,0.8,1,0.9],spectrum:["FF8","FF8","8F0","0F0","0F0","0D0","080"]},
  {name:"planet-green-7",radius:22,ambient:0.1,zoom:0.5,height:1,octaves:4,falloff:0.65,curve:[0,1],spectrum:["449","8A8","8A0","FFF"]},
  {name:"planet-hell-1",radius:10,ambient:0.1,zoom:2,height:3,octaves:2,falloff:0.2,curve:[0,0.2,1],spectrum:["F00","888","888","444"]},
  {name:"planet-hell-2",radius:10,ambient:0.1,zoom:1,height:2,octaves:2,falloff:0.2,curve:[0.4,0.5,0.45,0.3,0,0.9,0.95,1],spectrum:["F80","F00","666","666","666","666","666"]},
  {name:"planet-hell-3",radius:20,ambient:0.1,zoom:1.5,height:2,octaves:4,falloff:0.4,curve:[0.9,0.5,0.4,0.5,0.3,0,0],spectrum:["F80","F80","8f8","8f8","8f8","8f8"]},
  {type:"planet",name:"planet-hell-4",radius:20,ambient:0.1,zoom:1,height:2,octaves:4,falloff:0.3,curve:[0.6,0.32,0.45,0.5,0.3,0,0],spectrum:["F80","F00","A00","666","666","666","666","666"],model:null},
  {name:"planet-neutron-1",radius:10,ambient:0,zoom:1,height:2,octaves:4,falloff:0.3,curve:[0.4,0.5,0.45,0.5,0.3,0,0],spectrum:["8AF","48F","666","666","666","666","666"]},
  {name:"planet-neutron-2",radius:15,ambient:0.3,zoom:1,height:2,octaves:4,falloff:0.4,curve:[0.4,0.8,0.45,0.5,0.3,0,0],spectrum:["333","444","000","666","666","666","FFF","FFF"]},
  {type:"planet",name:"planet-neutron-3",radius:15,ambient:0,zoom:1,height:2,octaves:4,falloff:0.3,curve:[0.4,0.5,0.45,0.5,0.3,0,0],spectrum:["F80","F00","A00","666","666","666","666","666"],model:null},
  {name:"planet-rock-1",radius:20,ambient:0.1,zoom:3,height:3,octaves:4,falloff:0.25,curve:[0.4,0.45,0.6,1],spectrum:["666","666","666","666","666","F0F"]},
  {name:"planet-s-rock-1",radius:10,ambient:0.1,zoom:0.8,height:2,octaves:4,falloff:0.4,curve:[0,0.2,1],spectrum:["8A6","BA4","DB4"]},
  {name:"planet-soma",radius:8,ambient:0,zoom:1,height:1.5,octaves:4,falloff:0.3,curve:[0,0.2,1],spectrum:["20F","2FA","4AF","4AF"]},
  {type:"planet",name:"planet-water-1",radius:20,ambient:0.1,zoom:1.1,height:1,octaves:5,falloff:0.5,curve:[0.45,0.4,0.45,0.4,0.7,0.7,0.7,0.7],spectrum:["68F","36F","36F","FFF","FFF","FFF"],model:null},
  {type:"planet",name:"planet-water-frozen",radius:15,ambient:0.1,zoom:1,height:1,octaves:4,falloff:0.5,curve:[0.9,0.45,0.4,0.45,0.4,0.7,0.7,0.7,0.7],spectrum:["68F","36F","36F","FFF","FFF","FFF"],model:null}
]