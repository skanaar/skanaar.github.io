import {
  CompositeGeometry,
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

export class DungeonGame {
  turnRate = 2 * 90
  strideRate = 2
  targetX = 3
  targetY = 8
  targetRot = 0
  x = 3
  y = 8
  rot = 0
  message = null
  inventory = []
  
  constructor(world) {
    this.world = world
    this.entities = world.cloneEntities()
    this.mapMesh = buildMesh(world.mapModel())
  }

  turn(angle) {
    if (this.rot % 90 != 0) return
    this.message = null
    this.targetRot = this.rot+angle
  }

  strideEnd(stride) {
    const { targetX, targetY, targetRot } = this
    const x2 = targetX - stride * Math.round(Math.sin(degToRad(targetRot)))
    const y2 = targetY - stride * Math.round(Math.cos(degToRad(targetRot)))
    return [x2, y2]
  }
  
  isUnobstructed(x, y) {
    const item = this.entities.find(e => e.y === y && e.x === x)
    return item ? item.walkable : true
  }

  walk(stride) {
    const [x2, y2] = this.strideEnd(stride)
    if (!this.world.isWithinBounds(x2, y2)) {
      this.message = 'the map ends here'
      return
    }
    this.message = null
    if (!this.world.isWalkable(x2, y2)) {
      this.message = 'you hit a wall'
      return
    }
    if (!this.isUnobstructed(x2, y2)) {
      this.message = 'there is something in the way'
      return
    }
    this.targetX = x2
    this.targetY = y2
  }
  
  inspect() {
    const item = this.entities.find(e => e.y === this.targetY && e.x === this.targetX)
    if (item)
      this.message =  'you find a ' + item.name
    else
      this.message =  'you find nothing'
  }
  
  take() {
    const itemIndex = this.entities.findIndex(e => e.y === this.targetY && e.x === this.targetX)
    if (itemIndex > -1) {
      const item = this.entities[itemIndex]
      this.message =  'you take a ' + item.name
      this.inventory.push(item)
      this.entities.splice(itemIndex, 1)
    } else
      this.message =  'you find nothing'
  }
  
  use(item) {
    this.message =  'you use ' + item.name
    this.inventory.splice(this.inventory.findIndex(e => e === item), 1)
    switch (item.effect?.action) {
      case 'unlock': {
        const end = this.strideEnd(1)
        if (!end) return
        const [x2, y2] = end
        const entityIndex = this.entities.findIndex(e => e.x === x2 && e.y === y2)
        if (entityIndex < 0 || this.entities[entityIndex].name !== 'door') {
          this.message = 'does nothing'
          return
        }
        this.entities.splice(entityIndex, 1)
      }
    }
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
      RotateXYZ(-90,rot,0),
      Perspective(0.6, 1000, 20000),
      Translate(200,150,0),
    )
    
    const entityMeshes = this.entities.map((e) => {
      const model = this.world.models[e.model]
      return buildMesh(new CompositeGeometry('', [['translate',e.x*100,e.y*100,0]], [model]))
    })
    const scene = [...this.mapMesh, ...entityMeshes.flatMap(e => e)]
    return cullMesh(scene.map(q => transformQuad(q, matrix)))
  }  
}
