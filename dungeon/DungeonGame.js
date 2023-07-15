import {
  CompositeGeometry,
  CubeGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  MeshGeometry,
  buildMesh,
  cullMesh,
  degToRad,
  mmults,
  Perspective,
  RotateXYZ,
  transformQuad,
  Translate,
  vmag,
  vmult
} from './ThreeDeeEngine.js'

const map = [
  '##########',
  '#.#  ## ##',
  '# ##     #',
  '# ##  ## #',
  '#     :  #',
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

const hDoorGeo = new CompositeGeometry('', [], [...[-40, -20, 0, 20, 40].map(x => 
  new CubeGeometry('', [['scale',5,5,50], ['translate',x,0,0]])
)])
const vDoorGeo = new CompositeGeometry('', [], [...[-40, -20, 0, 20, 40].map(y => 
  new CubeGeometry('', [['scale',5,5,50], ['translate',0,y,0]])
)])

const cubes = new CompositeGeometry('map', [], map.flatMap((row, y) => {
  return row.split('').map((cell, x) => {
    switch(cell) {
      case '#': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [stoneWallGeo])
      case 'O': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [pillarWallGeo])
      case '°': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [pillarGeo])
      case '.': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [artefactGeo, floorGeo])
      case '-': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [hDoorGeo])
      case '|': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [vDoorGeo])
      case ' ': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [floorGeo])
      default: return new MeshGeometry('', [], [])
    }
  })
}))

const scene = buildMesh(cubes)

export class DungeonGame {
  turnRate = 2 * 90
  strideRate = 2
  targetX = 3
  targetY = 8
  targetRot = 180
  x = 3
  y = 8
  rot = 180
  message = null
  
  input(key) {
    if (this.message) return
    switch(key) {
      case "ArrowLeft": return this.turn(90)
      case "ArrowRight": return this.turn(-90)
      case "ArrowUp": return this.walk(1)
      case "ArrowDown": return this.walk(-1)
    }
  }
  
  turn(angle) {
    if (this.rot % 90 != 0) return
    this.targetRot = this.rot+angle
  }

  walk(stride) {
    const { targetX, targetY, targetRot } = this
    const x2 = targetX - stride * Math.round(Math.sin(degToRad(targetRot)))
    const y2 = targetY + stride * Math.round(Math.cos(degToRad(targetRot)))
    if (x2 < 0 || x2 >= map[0].length || y2 < 0 || y2 >= map.length) {
      console.log('out of bounds', { x2, y2 })
      return
    }
    if (!walkables.includes(map[y2][x2])) {
      console.log('not empty cell', { x2, y2, targetRot })
      return
    }
    this.targetX = x2
    this.targetY = y2
  }
  
  inspect() {
    this.message = 'you see nothing'
  }
  
  update(dt) {
    if (this.x === this.targetX && this.y === this.targetY && this.rot === this.targetRot) return
    const ε = 0.001
    const delta = [this.targetX - this.x, this.targetY - this.y, 0]
    const dist = vmag(delta)
    if (dist < ε) {
      this.x = this.targetX
      this.y = this.targetY
    } else {
      const step = vmult(Math.min(1, dt * this.strideRate/dist), delta)
      this.x += step[0]
      this.y += step[1]
    }
    
    const deltaRot = (this.targetRot - this.rot)
    const mag = Math.abs(deltaRot)
    if (mag < ε)
      this.rot = this.targetRot
    else
      this.rot += Math.min(1, dt * this.turnRate/mag) * deltaRot
  }

  mesh() {
    const {x,y,rot} = this
    const matrix = mmults(
      Translate(-x*100,-y*100,0),
      RotateXYZ(90,rot,0),
      Perspective(0.6, 1000, 20000),
      Translate(200,150,0),
    )
    return cullMesh(scene.map(q => transformQuad(q, matrix)))
  }  
}
