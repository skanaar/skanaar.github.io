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

const items = {
  a: { model: 'bottle', name: 'arboga 7,2', pickable: true, obstacle: false },
  s: { model: 'stone', name: 'rock', pickable: false, obstacle: false },
  k: { model: 'chest', name: 'key', pickable: true, obstacle: false },
  '-': { model: 'door_h', name: 'door', pickable: false, obstacle: true },
  '|': { model: 'door_h', name: 'door', pickable: false, obstacle: true },
}

const map = [
  '##########',
  '#s#  ## ##',
  '# ##    a#',
  '# ##  ## #',
  '#     :  #',
  '#-#O° ° ##',
  '#  °  a ##',
  'O  k  # ##',
  'O     | ##',
  '##########',
]
const walkables = [' ', ...Object.keys(items)]

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

const stoneGeo = new CubeGeometry('', [['subdivide'], ['sphere',15,15,5], ['rotate',0,0,20], ['translate',0,0,-42]])

const bottleGeo = new LatheGeometry('', [['scale',0.1,0.1,0.1], ['translate',30,30,-35]], 8, [
  [0,0,-140],[50,0,-150],[55,0,-145],[55,0,-40],[52,0,-10],[42,0,20],[28,0,50],[20,0,80],[18,0,110],[23,0,115],[20,0,135],[22,0,155],[18,0,159],[0,0,160]
])

const chestGeo = new CompositeGeometry('', [['rotate',90,0,-30], ['translate',20,20,-45]], [
  new LatheGeometry('', [['translate',0,5,0]], 8, [[2,0,-15],[10,0,-15],[10,0,15],[2,0,15]], 180),
  new CubeGeometry('', [['scale',10,5,15]])
])


const floorGeo = new MeshGeometry('', [['subdivide'], ['scale',45,45,0.01], ['translate',0,0,-50]], [[[1,-1,0],[-1,-1,0],[-1,1,0],[1,1,0]]])

const bars = [-40, -20, 0, 20, 40]
const hDoorGeo = new CompositeGeometry('', [], [
  ...bars.map(x => new CubeGeometry('', [['scale',5,5,50], ['translate',x,0,0]])),
  floorGeo
])
const vDoorGeo = new CompositeGeometry('', [], [
  ...bars.map(y => new CubeGeometry('', [['scale',5,5,50], ['translate',0,y,0]])),
  floorGeo
])

const blocks = map.flatMap((row, y) => {
  return row.split('').map((cell, x) => {
    switch(cell) {
      case '#': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [stoneWallGeo])
      case 'O': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [pillarWallGeo])
      case '°': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [pillarGeo])
      case '.': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [floorGeo])
      case '-': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [hDoorGeo])
      case '|': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [vDoorGeo])
      default: return new CompositeGeometry('', [['translate',x*100,y*100,0]], [floorGeo])
    }
  })
})
const entities = map.flatMap((row, y) => {
  return row.split('').map((cell, x) => {
    if (!items[cell]) return null
    switch(items[cell].model) {
      case 'bottle': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [bottleGeo])
      case 'stone': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [stoneGeo])
      case 'chest': return new CompositeGeometry('', [['translate',x*100,y*100,0]], [chestGeo])
    }
  })
}).filter(Boolean)

const scene = buildMesh(new CompositeGeometry('map', [], [...blocks, ...entities]))

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
  inventory = []
  
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
    this.message = null
    this.targetRot = this.rot+angle
  }

  walk(stride) {
    const { targetX, targetY, targetRot } = this
    const x2 = targetX - stride * Math.round(Math.sin(degToRad(targetRot)))
    const y2 = targetY + stride * Math.round(Math.cos(degToRad(targetRot)))
    if (x2 < 0 || x2 >= map[0].length || y2 < 0 || y2 >= map.length) {
      this.message = 'the map ends here'
      return
    }
    this.message = null
    if (!walkables.includes(map[y2][x2])) {
      this.message = 'there is something in the way'
      return
    }
    this.targetX = x2
    this.targetY = y2
  }
  
  inspect() {
    const item = items[map[this.targetY][this.targetX]]
    if (item)
      this.message =  'you find a ' + item.name
    else
      this.message =  'you find nothing'
  }
  
  take() {
    const item = items[map[this.targetY][this.targetX]]
    if (item) {
      this.message =  'you take a ' + item.name
      this.inventory.push(item)
    } else
      this.message =  'you find nothing'
  }
  
  use(item) {
    this.message =  'you use ' + item.name
    this.inventory.splice(this.inventory.findIndex(e => e === item), 1)
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
