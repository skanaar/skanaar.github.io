import { Vec4, Translate, vset } from './math.js'
import { vnormalize, vdot, vcross, vdiff, vmag, vadd, vmult } from './math.js'

const gravity = 100
const tirePressure = 10_000
const friction = 100
const wheelBase = 0.75

export class Wheel {
  constructor(r, [x,y,z]) {
    this.mass = 1
    this.pos = Vec4(x,y,z)
    this.force = Vec4(0,0,0)
    this.dir = Vec4(1,0,0)
    this.vel = Vec4(0,0,0)
    this.rotation = 0
    this.turnAngle = 0
    this.isTouching = false
    this.r = r
  }
  simulate(terrain, drivingForce, dt) {
    this.force[1] += gravity*this.mass
    const [x,y,z] = this.pos
    const h = terrain.valueAt(x, z) - y - this.r*.8
    this.isTouching = h < 0
    if (this.isTouching) {
      const normal = terrain.normal(x, z)
      this.force = vadd(this.force, vmult(-h*tirePressure, normal))
      const forward = vnormalize(vcross(vcross(normal, this.dir), normal))
      this.force = vadd(this.force, vmult(drivingForce, forward))
      this.#transversalFriction(normal)
    }
    var speedForward = vdot(this.dir, this.vel)
    this.rotation -= dt*speedForward*2 / (Math.PI * this.r)
  }
  #transversalFriction(normal) {
    const transversal = vnormalize(vcross(normal, this.dir))
    const sliding = vdot(transversal, this.vel)
    this.force = vadd(this.force, vmult(-sliding*friction, transversal))
  }
  turn([x,,z], angle) {
    this.turnAngle = Math.atan2(z,x) + angle
    var dx = x*Math.cos(angle) - z*Math.sin(angle)
    var dz = x*Math.sin(angle) + z*Math.cos(angle)
    this.dir = Vec4(dx, 0, dz)
  }
  apply(dt) {
    this.vel = vmult(0.99, vadd(this.vel, vmult(dt/this.mass, this.force)))
    this.pos = vadd(this.pos, vmult(dt, this.vel))
    vset(this.force, 0, 0, 0)
  }
  get transform() {
    return Translate(this.pos[0], this.pos[1], this.pos[2])
  }
}

export class Spring {
  constructor(a, b, distance) {
    this.springConstant = 200
    this.a = a
    this.b = b
    this.distance = distance
  }
  simulate(dt) {
    var diff = vdiff(this.a.pos, this.b.pos)
    var d = vmag(diff)
    var f = this.springConstant * (d - this.distance)
    this.a.force = vadd(this.a.force, vmult(-f, diff))
    this.b.force = vadd(this.b.force, vmult( f, diff))
  }
}

export class Rover {
  turn = 0
  drive = 0
  constructor() {
    let a = new Wheel(0.5, [wheelBase,0,wheelBase])
    let b = new Wheel(0.5, [wheelBase,0,-wheelBase])
    let c = new Wheel(0.5, [-wheelBase,0,wheelBase])
    let d = new Wheel(0.5, [-wheelBase,0,-wheelBase])
    this.wheels = [a,b,c,d]
    this.springs = [
      new Spring(a, b, 2*wheelBase),
      new Spring(c, d, 2*wheelBase),
      new Spring(a, c, 2*wheelBase),
      new Spring(b, d, 2*wheelBase),
      new Spring(a, d, 2*wheelBase*1.414),
      new Spring(b, c, 2*wheelBase*1.414),
    ]
  }
  simulate(terrain, dt) {
    this.#turnWheelsWithBoggies(this.turn)
    for (let spring of this.springs) spring.simulate(dt)
    for (let wheel of this.wheels) wheel.simulate(terrain, this.drive * 50, dt)
    for (let wheel of this.wheels) wheel.apply(dt)
  }
  #turnWheelsWithBoggies(turn) {
    const [a,b,c,d] = this.wheels
    var frontBoggie = vmult(0.5, vadd(a.pos, b.pos))
    var backBoggie = vmult(0.5, vadd(c.pos, d.pos))
    var dir = vnormalize(vdiff(frontBoggie, backBoggie))
    var leftFactor = turn < 0 ? 0.5 : 1
    var rightFactor = turn > 0 ? 0.5 : 1
    a.turn(dir,  leftFactor  * turn)
    b.turn(dir,  rightFactor * turn)
    c.turn(dir, -leftFactor  * turn)
    d.turn(dir, -rightFactor * turn)
  }
}
