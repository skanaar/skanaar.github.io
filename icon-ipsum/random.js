export function seq(count) {
  return [...new Array(Math.floor(count))].map((_, i) => i)
}

export function shuffle(list) {
  return list
    .map((item) => ({ item, k: random(0, 1000) }))
    .sort((a, b) => a.k - b.k)
    .map((e) => e.item)
}

export function random(min, max) {
  return min + Math.floor((max - min) * Math.random())
}

export function get(items, i) {
  return items[i % items.length]
}
