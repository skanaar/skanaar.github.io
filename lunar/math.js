export function Vec4(x, y, z, w = 1) {
  return new Float32Array([x, y, z, w])
}

export function normalize(v) {
  const d = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])
  return new Float32Array([v[0]/d, v[1]/d, v[2]/d, v[3]])
}

export function IdentityMatrix() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
}

export function TranslateMatrix(x, y, z) {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1])
}

export function OrthoMatrix() {
  return new Float32Array([1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1])
}

export function RotateX(a) {
  return new Float32Array([
    1,0,0,0,
    0,Math.cos(a),-Math.sin(a),0,
    0,Math.sin(a),Math.cos(a),0,
    0,0,0,1
  ])
}

export function RotateY(a) {
  return new Float32Array([
    Math.cos(a),0,Math.sin(a),0,
    0,1,0,0,
    -Math.sin(a),0,Math.cos(a),0,
    0,0,0,1
  ])
}

export function RotateZ(a) {
  return new Float32Array([
    Math.cos(a),-Math.sin(a),0,0,
    Math.sin(a),Math.cos(a),0,0,
    0,0,1,0,
    0,0,0,1
  ])
}

export function PerspectiveMatrix(fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, far == Infinity ? -1 : (far + near) * nf, -1,
    0, 0, far == Infinity ? -2 * near : 2 * far * near * nf, 0,
  ])
}

export function mmult(a, b) {
  var m = new Float32Array([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0])
  for (var i=0; i<4; i++) {
    for (var j=0; j<4; j++) {
      for (var k=0; k<4; k++) {
        m[i+4*j] += a[i+4*k]*b[k+4*j]
      }
    }
  }
  return m
}

export var vadd = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]]
export var vdiff = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]]
export var vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
export var vmult = (k, v) => [k*v[0], k*v[1], k*v[2]]
export var vmag = v => Math.sqrt(vdot(v, v))
export var vnormalize = v => vmult(1/vmag(v), v)
export var vcross = (a, b) => [
  a[1]*b[2] - a[2]*b[1],
  a[2]*b[0] - a[0]*b[2],
  a[0]*b[1] - a[1]*b[0]
]
