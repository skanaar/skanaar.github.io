import {
  CompositeGeometry,
  CubeGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  MeshGeometry,
  buildMesh,
  cullMesh,
  degToRad,
  lerp,
  mmults,
  perspective,
  rotateXYZ,
  transformQuad,
  translate
} from './ThreeDeeEngine.js'
import { el, App, Button } from './assets/system.js'

const map = [
  '##########',
  '#.#  ## ##',
  '# ##     #',
  '# ##  ## #',
  '#        #',
  '#-#O° ° ##',
  '#  °    ##',
  'O  .  # ##',
  'O     | ##',
  '##########',
]
const walkables = ['.', ' ']

const triggers = [
  { loc: [3,7], trigger: 'visit', message: 'You have found a golden key' }
]

const stoneWallGeo = new ExtrudeGeometry('', [['scale',50,50,50]], [
  [-1,-0.8,-1],[-1,0,-1],[-1,0.8,-1],
  [-0.8,1,-1],[0,1,-1],[0.8,1,-1],
  [1,0.8,-1],[1,0,-1],[1,-0.8,-1],
  [0.8,-1,-1],[0,-1,-1],[-0.8,-1,-1],[-1,-0.8,-1]
], 2)

const pillarWallGeo = new LatheGeometry('', [], 16, [
  [-55,0,-50],[-55,0,-45],[-50,0,-40],[-45,0,-30],[-45,0,30],[-50,0,40],[-55,0,45],[-55,0,50]
])

const pillarGeo = new LatheGeometry('', [], 8, [
  [-35,0,-50],[-35,0,-45],[-30,0,-40],[-25,0,-30],[-25,0,30],[-30,0,40],[-35,0,45],[-35,0,50]
])

const artefactGeo = new CubeGeometry('', [['subdivide'], ['sphere',15,15,5], ['rotate',0,0,20], ['translate',0,0,-42]])

const floorGeo = new MeshGeometry('', [['subdivide'], ['scale',45,45,0.01], ['translate',0,0,-50]], [[[1,-1,0],[-1,-1,0],[-1,1,0],[1,1,0]]])

const cubes = new CompositeGeometry('map', [], map.flatMap((row, y) => {
  return row.split('').map((cell, x) => {
    switch(cell) {
      case '#': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [stoneWallGeo])
      case 'O': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [pillarWallGeo])
      case '°': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [pillarGeo])
      case '.': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [artefactGeo, floorGeo])
      default: return new CompositeGeometry('', [['translate',x*100,y*100,0]], [floorGeo])
    }
  })
}))

const scene = buildMesh(cubes)

const icon = 'arch.svg'
export const app = new App('Dungeon', Dungeon, icon, [150, 50], 'noresize')

export function Dungeon() {
  const [x, setX] = React.useState(3)
  const [y, setY] = React.useState(8)
  const [rot, setRot] = React.useState(180)

  const matrix = mmults(
    translate(-x*100,-y*100,0),
    rotateXYZ(90,rot,0),
    perspective(0.6, 1000, 20000),
    translate(200,150,0),
  )
  const mesh = cullMesh(scene.map(q => transformQuad(q, matrix)))

  return (
    el('dungeon-crawler', {},
      el('style', {},
        `
        dungeon-crawler svg { display: block; background: linear-gradient(to top, #eee, #000, #eee) }
        dungeon-crawler footer {
          display: flex;
          justify-content: space-between;
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 10px;
        }
        dungeon-crawler .canvas-3d {
          display: block;
          position: relative;
          margin: -10px;
          top: 20px;
          width: 400px;
          height: 300px;
        }
        dungeon-crawler svg.canvas-3d path {
          stroke-linejoin: bevel;
          stroke-width: 1px;
          stroke: #000;
        }
        dungeon-crawler svg.canvas-3d path.outline {
          stroke: #000;
          stroke-width: 1px;
          stroke-dasharray: 1 5;
        }`),

      el('svg', {
        className: 'canvas-3d',
        viewBox: '0 0 400 300'
      },
        mesh.map((e, i) => el('path', {
          key: `m${i}`,
          d: quadPath(e),
          fill: `rgb(${rund(-e[3][2]*15)}, ${rund(-e[3][2]*15)}, ${rund(-e[3][2]*15)})`,
        } )),
      ),

      el('footer', {},
        `${Math.round(x)},${Math.round(y)} | ${Math.round(rot)}`,
        el(Button, { onClick: () => {
          if (x % 1 != 0 || y % 1 != 0 || rot % 90 != 0) return
          animate(rot, rot+90, (r) => setRot((r+360)%360))
        } }, '←'),
        el(Button, { onClick: () => {
          if (x % 1 != 0 || y % 1 != 0 || rot % 90 != 0) return
          const x2 = x - Math.round(Math.sin(degToRad(rot)))
          const y2 = y + Math.round(Math.cos(degToRad(rot)))
          if (x2 < 0 || x2 >= map[0].length || y2 < 0 || y2 >= map.length) {
            console.log('out of bounds', { x2, y2 })
            return
          }
          if (!walkables.includes(map[y2][x2])) {
            console.log('not empty cell', { x2, y2, rot })
            return
          }
          animate(x, x2, setX)
          animate(y, y2, setY)
        } }, '↑'),
        el(Button, { onClick: () => {
          if (x % 1 != 0 || y % 1 != 0 || rot % 90 != 0) return
          animate(rot, rot-90, setRot)
        } }, '→'),
      ),
    )
  )
  
  function quadPath([a,b,c,d]) {
    return `M${rund(a[0])},${rund(a[1])} L${rund(b[0])},${rund(b[1])} L${rund(c[0])},${rund(c[1])} L${rund(d[0])},${rund(d[1])} Z`
  }
}

function rund(x) {
  return Math.round(x)
}

const STEPS = 25
function animate(from, to, setter) {
  for (let i=0; i<=STEPS; i++) {
    setTimeout(() => setter(lerp(i/STEPS, from, to)), i*500/STEPS)
  }
}
