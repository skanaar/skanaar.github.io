import {
  CompositeGeometry,
  CubeGeometry,
  ExtrudeGeometry,
  buildMesh,
  cullMesh,
  degToRad,
  mmults,
  perspective,
  rotateXYZ,
  transformQuad,
  translate
} from './ThreeDeeEngine.js'
import { el, App, Button } from './assets/system.js'

const map = [
  '##########',
  '#0## ## ##',
  '# ##     #',
  '# ##  ## #',
  '#        #',
  '##### # ##',
  '#  #    ##',
  '#  0  # ##',
  '#     ####',
  '#### #####',
]

const wallGeo = new ExtrudeGeometry('', [['scale',50,50,50]], [
  [-1,-0.8,-1],[-1,0,-1],[-1,0.8,-1],
  [-0.8,1,-1],[0,1,-1],[0.8,1,-1],
  [1,0.8,-1],[1,0,-1],[1,-0.8,-1],
  [0.8,-1,-1],[0,-1,-1],[-0.8,-1,-1],[-1,-0.8,-1]
], 2)

const cubes = new CompositeGeometry('map', [], map.flatMap((row, y) => {
  return row.split('').map((cell, x) => {
    if (cell === '#')
      return new CompositeGeometry('', [['translate',x*100,y*100,0]], [wallGeo])
    if (cell === '0')
      return new CubeGeometry('', [['subdivide'], ['sphere',20,20,20], ['rotate',40,40,40], ['translate',x*100,y*100,0]])
    return new CompositeGeometry('', [], [])
  })
}))

const scene = buildMesh(cubes)

const icon = 'arch.svg'
export const app = new App('Dungeon', Dungeon, icon, [150, 50], 'noresize')

export function Dungeon() {
  const [x, setX] = React.useState(-300)
  const [y, setY] = React.useState(-800)
  const [rot, setRot] = React.useState(0)

  const matrix = mmults(
    translate(x,y,0),
    rotateXYZ(-90,rot,0),
    perspective(0.6, 1000, 20000),
    translate(200,150,0),
  )
  const mesh = cullMesh(scene.map(q => transformQuad(q, matrix)))

  return (
    el('dungeon-crawler', {},
      el('style', {},
        `
        dungeon-crawler svg { display: block; background: #eee }
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
          fill: #fff;
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
          d: `M${e[0][0]},${e[0][1]} L${e[1][0]},${e[1][1]} L${e[2][0]},${e[2][1]} L${e[3][0]},${e[3][1]} Z`,
          fill: 'none',
        } )),
      ),

      el('footer', {},
        `${Math.floor(x)},${Math.floor(y)} | ${Math.floor(rot)}`,
        el(Button, { onClick: () => setRot(k => k + 10) }, '←'),
        el(Button, { onClick: () => {
          setX(k => k + 20 * Math.sin(degToRad(rot)))
          setY(k => k + 20 * Math.cos(degToRad(rot)))
        } }, '↑'),
        el(Button, { onClick: () => setRot(k => k - 10) }, '→'),
      ),
    )
  )
}
