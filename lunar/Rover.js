import { Vec4, Translate, vset } from './math.js'
import { vnormalize, vdot, vcross, vdiff, vmag, vadd, vmult } from './math.js'

const gravity = 300
const tirePressure = 20_000
const tireGrip = 100
const tyreDampening = 10
const groundFriction = 2
const maxDrive = 150

export class Rover {
  turn = 0
  driveDirection = 0
  constructor(y) {
    const wheelBase = 0.75
    let a = new Wheel(0.5, [wheelBase,y,wheelBase])
    let b = new Wheel(0.5, [wheelBase,y,-wheelBase])
    let c = new Wheel(0.5, [-wheelBase,y,wheelBase])
    let d = new Wheel(0.5, [-wheelBase,y,-wheelBase])
    let cockpit = new Wheel(0.5, [0,y-wheelBase,0])
    this.wheels = [a,b,c,d,cockpit]
    this.springs = [
      new Spring(a, b, 2*wheelBase),
      new Spring(c, d, 2*wheelBase),
      new Spring(a, c, 2*wheelBase),
      new Spring(b, d, 2*wheelBase),
      new Spring(a, d, 2*wheelBase*1.414),
      new Spring(b, c, 2*wheelBase*1.414),
      new Spring(a, cockpit, 2*wheelBase),
      new Spring(b, cockpit, 2*wheelBase),
      new Spring(c, cockpit, 2*wheelBase),
      new Spring(d, cockpit, 2*wheelBase),
    ]
  }
  simulateForces(terrain, dt) {
    this.#turnWheelsWithBoggies(this.turn)
    for (let spring of this.springs) spring.simulate(dt)
    const drive = this.driveDirection * maxDrive
    for (let wheel of this.wheels) wheel.simulate(terrain, drive, dt)
  }
  apply(dt) {
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

export class Wheel {
  constructor(r, [x,y,z]) {
    this.mass = 1
    this.pos = Vec4(x,y,z)
    this.prevPos = Vec4(x,y,z)
    this.force = Vec4(0,0,0)
    this.dir = Vec4(1,0,0)
    this.vel = Vec4(0,0,0)
    this.rotation = 0
    this.turnAngle = 0
    this.isTouching = false
    this.r = r
  }
  impulse(factor, force) {
    this.force = vadd(this.force, vmult(factor, force))
  }
  simulate(terrain, drivingForce, dt) {
    this.impulse(dt*gravity*this.mass, Vec4(0,1,0))
    const [x,y,z] = this.pos
    const dh = terrain.valueAt(x, z) - y - this.r
    this.isTouching = dh < 0
    if (this.isTouching) {
      const normal = terrain.normal(x, z)
      this.impulse(dt*dh*dh*tirePressure, normal)
      const forward = vnormalize(vcross(vcross(normal, this.dir), normal))
      this.impulse(dt*drivingForce, forward)
      this.#transversalFriction(normal, dt)
      this.#longitudinalFriction(normal, dt)
      this.#tireDampening(normal, dt)
      if (vmag(this.force) < 1) {
        vset(this.force, 0,0,0)
      }
    }
  }
  #transversalFriction(normal, dt) {
    const transversal = vnormalize(vcross(normal, this.dir))
    const sliding = vdot(transversal, this.vel)
    this.impulse(-dt*sliding*tireGrip, transversal)
  }
  #longitudinalFriction(normal, dt) {
    this.impulse(-dt*groundFriction, this.vel)
  }
  #tireDampening(normal, dt) {
    const speed = vdot(normal, this.vel)
    if (speed > 0) {
      this.impulse(-speed*tyreDampening, normal)
    }
  }
  turn([x,,z], angle) {
    this.turnAngle = Math.atan2(z,x) + angle
    var dx = x*Math.cos(angle) - z*Math.sin(angle)
    var dz = x*Math.sin(angle) + z*Math.cos(angle)
    this.dir = Vec4(dx, 0, dz)
  }
  apply(dt) {
    // verlet integration
    let temp = this.pos
    this.pos = vadd(
      vdiff(vmult(2, this.pos), this.prevPos),
      vmult(dt*dt/this.mass, this.force)
    )
    this.prevPos = temp
    const step = vdiff(this.pos, this.prevPos)
    this.vel = vmult(1/dt, step)
    var stepLength = vdot(this.dir, step)
    // wheel rotation
    this.rotation -= stepLength / (Math.PI * this.r)
    // reset forces
    vset(this.force, 0, 0, 0)
  }
  get transform() {
    return Translate(this.pos[0], this.pos[1], this.pos[2])
  }
}

export class Spring {
  static springConstant = 2000
  static dampening = 80
  constructor(a, b, distance) {
    this.a = a
    this.b = b
    this.distance = distance
  }
  simulate(dt) {
    var diff = vdiff(this.a.pos, this.b.pos)
    var d = vmag(diff)
    var dir = vmult(1/d, diff)
    var speed = vdot(vdiff(this.a.vel, this.b.vel), dir)
    var f = Spring.springConstant * (d - this.distance)
    this.a.impulse(-dt*f, dir)
    this.b.impulse(+dt*f, dir)
    // spring dampening
    this.a.impulse(-dt*Spring.dampening * speed, dir)
    this.b.impulse(+dt*Spring.dampening * speed, dir)
  }
}
