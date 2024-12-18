export function Vec4(x, y, z, w = 1) {
  const output = new Float32Array(4)
  output[0] = x
  output[1] = y
  output[2] = z
  output[3] = w
  return output
}

export var vadd = (a, b) => Vec4(a[0]+b[0], a[1]+b[1], a[2]+b[2])
export var vdiff = (a, b) => Vec4(a[0]-b[0], a[1]-b[1], a[2]-b[2])
export var vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
export var vmult = (k, vec) => Vec4(k*vec[0], k*vec[1], k*vec[2])
export var vmag = v => Math.sqrt(vdot(v, v))
export var vnormalize = v => vmult(1/vmag(v), v)
export var vcross = (a, b) => Vec4(
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

export function mmults(...matrixes) {
  if (matrixes.length === 1) return matrixes[0]
  if (matrixes.length === 2) return mmult(matrixes[0], matrixes[1])
  return mmult(matrixes[0], mmults(...matrixes.slice(1)))
}
