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
  Quad,
  vmag,
  vmult
} from './ThreeDeeEngine.js'

export class DungeonGame {
  turnRate = 2 * 90
  strideRate = 2
  targetX = 1
  targetY = 1
  targetRot = 0
  x = 1
  y = 1
  rot = 0
  message = null
  inventory = []
  dialogIndex = null
  dialog = null
  dialogAnswers = []
  scriptProgress = []
  
  constructor(world) {
    this.world = world
    const [x, y] = world.startLocation()
    this.targetX = x
    this.targetY = y
    this.x = x
    this.y = y
    this.entities = world.cloneEntities()
    this.mapMesh = buildMesh(world.mapModel())
    this.scriptProgress = world.scripts.map(() => 0)
  }

  turn(angle) {
    if (this.dialog) return
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
    if (this.dialog) return
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
    const [x2, y2] = this.strideEnd(1)
    const itemBelow = this.entities.find(e => e.y === this.targetY && e.x === this.targetX)
    const itemAhead = this.entities.find(e => e.y === y2 && e.x === x2)
    if (itemBelow)
      this.message =  'you find a ' + itemBelow.name
    else if (itemAhead)
      this.message =  'there is a ' + itemAhead.name + ' up ahead'
    else
      this.message =  'you find nothing'
  }
  
  take() {
    const item = this.entities.find(e => e.y === this.targetY && e.x === this.targetX)
    if (!item || !item.pickable) {
      this.message =  'nothing to take'
    } else {
      this.message =  'you take a ' + item.name
      this.inventory.push(item)
      remove(this.entities, item)
    }
  }
  
  interact() {
    this.updateScripts('interact')
  }
  
  use(item) {
    this.message =  'you use ' + item.name
    switch (item.effect?.action) {
      case 'consume':
        remove(this.inventory, item)
        break
      case 'remove': {
        const entity = this.entityAhead()
        if (entity && entity.name === item.effect.remove) {
          remove(this.entities, entity)
          remove(this.inventory, item)
        } else {
          this.message = 'does nothing'
        }
        break
      }
    }
  }
  
  entityAhead() {
    const [x2, y2] = this.strideEnd(1)
    return this.entities.find(e => e.x === x2 && e.y === y2)
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
    
    this.updateScripts()
  }
  
  updateScripts(event = null) {
    this.dialogIndex = null
    this.dialog = null
    this.dialogAnswers = []
    for (const i in this.world.scripts) {
      const script = this.world.scripts[i]
      const step = script[this.scriptProgress[i]]
      if (!step) continue
      if (step.type === 'condition' && step.visit) {
        if (step.visit[0] === this.x && step.visit[1] === this.y) {
          this.scriptProgress[i]++
          this.updateScripts()
          return
        }
      }
      if (step.type === 'condition' && step.interact) {
        if (event !== 'interact') return
        if (step.interact[0] === this.x && step.interact[1] === this.y) {
          this.scriptProgress[i]++
          this.updateScripts()
          return
        }
      }
      if (step.type === 'condition' && step.haveItem) {
        if (this.inventory.some(e => e.name === step.haveItem)) {
          this.scriptProgress[i]++
          this.updateScripts()
          return
        }
      }
      if (step.type === 'dialog') {
        this.dialogIndex = i
        this.dialog = step.text
        this.dialogAnswers = step.answers
      }
      if (step.type === 'goto' && step.step) {
        const index = script.findIndex(e => e.id === step.step)
        if (index == -1) throw new Error('invalid script '+i)
        this.scriptProgress[i] = index
        this.updateScripts()
        return
      }
    }
  }
  
  respond(text, i) {
    this.scriptProgress[this.dialogIndex]++
    this.dialogIndex = null
    this.updateScripts()
  }
  
  mesh() {
    const {x,y,rot} = this
    const matrix = mmults(
      Translate(-x*100,-y*100,0),
      RotateXYZ(-90,rot,0),
      Translate(0,0,50),
      Perspective(0.6, 1000, 20000),
      Translate(200,150,0),
    )
    
    const entityMeshes = this.entities.map((e) => {
      const model = this.world.models[e.model]
      return buildMesh(new CompositeGeometry('', [['translate',e.x*100,e.y*100,0]], [model]))
    })
    const scene = [...this.mapMesh, ...entityMeshes.flatMap(e => e)]
    const mesh = cullMesh(scene.map(q => transformQuad(q, matrix)))
    return mesh.map((quad) => Quad(quad[0],quad[1],quad[2],quad[3],fogShader(quad)))
  }
}

function fogShader(quad) {
  return quad[4] * (1 - clamp(5 / Math.abs(quad[3][2]), 0, 1))
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value))
}

function remove(list, item) {
  const index = list.findIndex(e => e === item)
  if (index > -1)
  list.splice(index, 1)
}