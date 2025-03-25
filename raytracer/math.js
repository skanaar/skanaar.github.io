export const EPSILON = 0.001
export function Vec(x, y, z) {
  const output = new Float32Array(3)
  output[0] = x
  output[1] = y
  output[2] = z
  return output
}

export var add = (a, b) => Vec(a[0]+b[0], a[1]+b[1], a[2]+b[2])
export var diff = (a, b) => Vec(a[0]-b[0], a[1]-b[1], a[2]-b[2])
export var dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
export var mult = (k, vec) => Vec(k*vec[0], k*vec[1], k*vec[2])
export var mag = v => Math.sqrt(dot(v, v))
export var normalize = v => mult(1/mag(v), v)
export var norm = v => mult(1/mag(v), v)
export var cross = (a, b) => Vec(
  a[1]*b[2] - a[2]*b[1],
  a[2]*b[0] - a[0]*b[2],
  a[0]*b[1] - a[1]*b[0]
)

export function vset(vec, x,y,z) { vec[0] = x; vec[1] = y; vec[2] = z }

const Matrix = (elements) => new Float32Array(elements)
export const Identity = () => Matrix([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
export const Scale = (s) => Matrix([s,0,0,0, 0,s,0,0, 0,0,s,0, 0,0,0,s])
export const Translate = (x,y,z) => Matrix([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1])
export const Ortho = () => Matrix([1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1])
const sin = (x) => Math.sin(x)
const cos = (x) => Math.cos(x)
export const rotx = (a, [x, y, z]) => Vec(
  x,
  Math.cos(a)*y - Math.sin(a)*z,
  Math.sin(a)*y + Math.cos(a)*z
)
export function RotateX(a) {
  return Matrix([1,0,0,0, 0,cos(a),-sin(a),0, 0,sin(a),cos(a),0, 0,0,0,1])
}
export function RotateY(a) {
  return Matrix([cos(a),0,sin(a),0, 0,1,0,0, -sin(a),0,cos(a),0, 0,0,0,1])
}
export function RotateZ(a) {
  return Matrix([cos(a),-sin(a),0,0, sin(a),cos(a),0,0, 0,0,1,0, 0,0,0,1])
}

export function Perspective(fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  return Matrix([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, far == Infinity ? -1 : (far + near) * nf, -1,
    0, 0, far == Infinity ? -2 * near : 2 * far * near * nf, 0,
  ])
}

export function mmult(a, b) {
  var m = Matrix([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0])
  for (var i=0; i<4; i++) {
    for (var j=0; j<4; j++) {
      for (var k=0; k<4; k++) {
        m[i+4*j] += a[i+4*k]*b[k+4*j]
      }
    }
  }
  return m
}

export function matrixStack(...matrixes) {
  if (matrixes.length === 1) return matrixes[0]
  if (matrixes.length === 2) return mmult(matrixes[0], matrixes[1])
  return mmult(matrixes[0], matrixStack(...matrixes.slice(1)))
}

export function mapply(m, v) {
  return Vec(
    m[0+4*0]*v[0] + m[1+4*0]*v[1] + m[2+4*0]*v[2],
    m[0+4*1]*v[0] + m[1+4*1]*v[1] + m[2+4*1]*v[2],
    m[0+4*2]*v[0] + m[1+4*2]*v[1] + m[2+4*2]*v[2],
    m[0+4*3]*v[0] + m[1+4*3]*v[1] + m[2+4*3]*v[2],
  )
}

export const crossDiff = (a, b, v) => Vec(
  (a[1]-b[1])*v[2]-(a[2]-b[2])*v[1],
  (a[2]-b[2])*v[0]-(a[0]-b[0])*v[2],
  (a[0]-b[0])*v[1]-(a[1]-b[1])*v[0]
)

export const sq = (x) => x * x
export const clamp = (x, low, high) => Math.max(low, Math.min(x, high))
export const rnd = (t) => t * Math.random()

export function* generateRowByRowCoordinates(size) {
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++)
      yield Vec(i,j,0)
}
