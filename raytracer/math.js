export const Vec = (x, y, z) => ({ x, y, z })
export const add = (a, b) => Vec(a.x + b.x, a.y + b.y, a.z + b.z)
export const diff = (a, b) => Vec(a.x - b.x, a.y - b.y, a.z - b.z)
export const mult = (k, vec) => Vec(k*vec.x, k*vec.y, k*vec.z)
export const dot = (a,b) => a.x*b.x + a.y*b.y + a.z*b.z
export const cross = (a, b) => Vec(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x)
export const mag = (vec) => Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z)
export const sqMag = (vec) => vec.x * vec.x + vec.y * vec.y + vec.z * vec.z
export const div = (vec, k) => Vec(vec.x / k, vec.y / k, vec.z / k)
export const norm = (v) => div(v, mag(v))
export const rotx = (a, { x, y, z }) => Vec(x, Math.cos(a)*y - Math.sin(a)*z, Math.sin(a)*y + Math.cos(a)*z)

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
