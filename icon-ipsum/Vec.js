export function Vec(x, y) {
  return { x, y }
}

export function dist(a, b) {
  return mag(diff(a, b))
}
export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y }
}
export function diff(a, b) {
  return { x: a.x - b.x, y: a.y - b.y }
}
export function mult(v, factor) {
  return { x: factor * v.x, y: factor * v.y }
}
export function mag(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}
export function normalize(v) {
  return mult(v, 1 / mag(v))
}
export function rot(a) {
  return { x: a.y, y: -a.x }
}
