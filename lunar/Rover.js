import { Vec4, Translate, vset } from './math.js'
import { vnormalize, vdot, vcross, vdiff, vmag, vadd, vmult } from './math.js'

const gravity = 100
const tirePressure = 10000

export class Wheel {
  constructor(r, [x,y,z]) {
    this.mass = 1
    this.pos = Vec4(x,y,z)
    this.force = Vec4(0,0,0)
    this.dir = Vec4(1,0,0)
    this.vel = Vec4(0,0,0)
    this.rotation = 0
    this.drivingForce = 100
    this.isTouching = false
    this.r = r
  }
  simulate(terrain, dt) {
    this.force[1] += gravity*this.mass
    const [x,y,z] = this.pos
    const h = terrain.valueAt(x, z) - y - this.r*.8
    this.isTouching = h < 0
    if (this.isTouching) {
      const normal = terrain.normal(x, z)
      const forward = vnormalize(vcross(vcross(normal, this.dir), normal))
      this.force = vadd(this.force, vmult(-h*tirePressure, normal))
      this.force = vadd(this.force, vmult(this.drivingForce, forward))
    }
    var speedForward = vdot(this.dir, this.vel)
    this.rotation -= dt*speedForward*2 / (Math.PI * this.r)
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
    this.springConstant = 30
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
  constructor() {
    let a = new Wheel(0.5, [1,0,1])
    let b = new Wheel(0.5, [1,0,-1])
    let c = new Wheel(0.5, [-1,0,1])
    let d = new Wheel(0.5, [-1,0,-1])
    this.wheels = [a,b,c,d]
    this.springs = [
      new Spring(a, b, 2),
      new Spring(c, d, 2),
      new Spring(a, c, 2),
      new Spring(b, d, 2),
      new Spring(a, d, 2*1.414),
      new Spring(b, c, 2*1.414),
    ]
  }
  simulate(terrain, dt) {
    for (let spring of this.springs) spring.simulate(dt)
    for (let wheel of this.wheels) wheel.simulate(terrain, dt)
    for (let wheel of this.wheels) wheel.apply(dt)
  }
}
