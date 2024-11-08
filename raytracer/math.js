export const EPSILON = 0.001

export const Vec = (x, y, z) => ({ x, y, z })
export const add = (a, b) => Vec(a.x + b.x, a.y + b.y, a.z + b.z)
export const diff = (a, b) => Vec(a.x - b.x, a.y - b.y, a.z - b.z)
export const mult = (k, vec) => Vec(k*vec.x, k*vec.y, k*vec.z)
export const dot = (a,b) => a.x*b.x + a.y*b.y + a.z*b.z
export const cross = (a, b) =>
  Vec(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x)
export const mag = (vec) =>
  Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z)
export const sqMag = (vec) => vec.x * vec.x + vec.y * vec.y + vec.z * vec.z
export const div = (vec, k) => Vec(vec.x / k, vec.y / k, vec.z / k)
export const norm = (v) => div(v, mag(v))
export const rotx = (a, { x, y, z }) => Vec(
  x,
  Math.cos(a)*y - Math.sin(a)*z,
  Math.sin(a)*y + Math.cos(a)*z
)

export function mapply(m, v) {
  return Vec(
    m[0+4*0]*v.x + m[1+4*0]*v.y + m[2+4*0]*v.z + m[3+4*0]*1,
    m[0+4*1]*v.x + m[1+4*1]*v.y + m[2+4*1]*v.z + m[3+4*1]*1,
    m[0+4*2]*v.x + m[1+4*2]*v.y + m[2+4*2]*v.z + m[3+4*2]*1,
    m[0+4*3]*v.x + m[1+4*3]*v.y + m[2+4*3]*v.z + m[3+4*3]*1,
  )
}

export function matrixmult(a, b) {
  let matrix = new Array(16).fill(0.0)
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      matrix[x+4*y] =
        a[0+4*y]*b[x+4*0] +
        a[1+4*y]*b[x+4*1] +
        a[2+4*y]*b[x+4*2] +
        a[3+4*y]*b[x+4*3]
  return matrix
}

export function matrixStack(...matrices) {
  return matrices.reduce((a,b) => matrixmult(a, b))
}

export const RotateX = (a) => [
  1, 0, 0, 0,
  0, Math.cos(a), -Math.sin(a), 0,
  0, Math.sin(a), Math.cos(a), 0,
  0, 0, 0, 1
]
export const RotateY = (a) => [
  Math.cos(a), 0, -Math.sin(a), 0,
  0, 1, 0, 0,
  Math.sin(a), 0, Math.cos(a), 0,
  0, 0, 0, 1
]
export const RotateZ = (a) => [
  Math.cos(a), -Math.sin(a), 0, 0,
  Math.sin(a), Math.cos(a), 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]
export const Identity = () => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
]
export const Translate = (dx,dy,dz) => [
  1, 0, 0, dx,
  0, 1, 0, dy,
  0, 0, 1, dz,
  0, 0, 0, 1
]
export const Scale = (sx,sy,sz) => [
  sx, 0, 0, 0,
  0, sy, 0, 0,
  0, 0, sz, 0,
  0, 0, 0, 1
]

export const crossDiff = (a, b, v) => Vec(
  (a.y-b.y)*v.z-(a.z-b.z)*v.y,
  (a.z-b.z)*v.x-(a.x-b.x)*v.z,
  (a.x-b.x)*v.y-(a.y-b.y)*v.x
)

export const sq = (x) => x * x
export const clamp = (x, low, high) => Math.max(low, Math.min(x, high))
export const rnd = (t) => t * Math.random()

export function* generateRowByRowCoordinates(size) {
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++)
      yield Vec(i,j,0)
}
